import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/client'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = (createAdminClient() as any)

  switch (event.type) {
    // ── Subscription created/updated ──────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const priceId = sub.items.data[0]?.price.id

      // Map priceId → plan
      const planMap: Record<string, string> = {
        [process.env.STRIPE_PRICE_STARTER!]: 'starter',
        [process.env.STRIPE_PRICE_PRO!]: 'pro',
        [process.env.STRIPE_PRICE_BUSINESS!]: 'business',
      }
      const plan = planMap[priceId] || 'free'

      await supabase.from('profiles')
        .update({ plan, stripe_subscription_id: sub.id, subscription_status: sub.status })
        .eq('stripe_customer_id', customerId)
      break
    }

    // ── Subscription cancelled ────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('profiles')
        .update({ plan: 'free', stripe_subscription_id: null, subscription_status: 'cancelled' })
        .eq('stripe_customer_id', sub.customer as string)
      break
    }

    // ── Checkout completed (subscription or points) ───────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId

      // サブスクリプション購入 → プラン即時反映
      if (session.mode === 'subscription' && session.subscription) {
        const subId = session.subscription as string
        const sub = await stripe.subscriptions.retrieve(subId)
        const priceId = sub.items.data[0]?.price.id
        const planMap: Record<string, string> = {
          [process.env.STRIPE_PRICE_STARTER!]: 'starter',
          [process.env.STRIPE_PRICE_PRO!]:     'pro',
          [process.env.STRIPE_PRICE_BUSINESS!]:'business',
        }
        const plan = planMap[priceId] || 'starter'
        await supabase.from('profiles')
          .update({ plan, stripe_subscription_id: subId, subscription_status: sub.status })
          .eq('stripe_customer_id', session.customer as string)
        break
      }

      // ポイント購入（一回払い）
      if (session.mode === 'payment') {
        if (!userId) break
        const amount = session.amount_total || 0
        const pointsMap: Record<number, number> = { 1000: 100, 5000: 550, 10000: 1200 }
        const points = pointsMap[amount] || Math.floor(amount / 10)
        const { data: profile } = await supabase.from('profiles').select('points').eq('id', userId).single()
        if (profile) {
          const newBalance = profile.points + points
          await supabase.from('profiles').update({ points: newBalance }).eq('id', userId)
          await supabase.from('point_transactions').insert({
            user_id: userId, type: 'purchase', amount: points,
            balance_after: newBalance,
            description: `ポイント購入 ${points}pt`,
            stripe_payment_id: session.payment_intent as string,
          })
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
