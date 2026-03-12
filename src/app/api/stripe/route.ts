import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { stripe, createCheckoutSession, getOrCreateCustomer, PLANS, POINT_PACKAGES } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = (createServerSupabaseClient() as any)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, planId, packageId } = await request.json()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL!

  try {
    // Ensure Stripe customer exists
    let customerId = profile.stripe_customer_id
    if (!customerId) {
      const customer = await getOrCreateCustomer(profile.email, profile.full_name || '', user.id)
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    if (type === 'subscription') {
      const plan = PLANS[planId as keyof typeof PLANS]
      if (!plan || !plan.priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

      const session = await createCheckoutSession({
        customerId, priceId: plan.priceId,
        userId: user.id,
        successUrl: `${origin}/dashboard/billing?success=1&plan=${planId}`,
        cancelUrl: `${origin}/dashboard/billing?cancelled=1`,
        mode: 'subscription',
      })
      return NextResponse.json({ url: session.url })
    }

    if (type === 'points') {
      const pkg = POINT_PACKAGES.find(p => p.id === packageId)
      if (!pkg || !pkg.priceId) return NextResponse.json({ error: 'Invalid package' }, { status: 400 })

      const session = await createCheckoutSession({
        customerId, priceId: pkg.priceId,
        userId: user.id,
        successUrl: `${origin}/dashboard/billing?success=1&points=${pkg.points}`,
        cancelUrl: `${origin}/dashboard/billing?cancelled=1`,
        mode: 'payment',
      })
      return NextResponse.json({ url: session.url })
    }

    // ── 解約申請（期間末に自動解約）──────────────────────────
    if (type === 'cancel') {
      const subId = profile.stripe_subscription_id
      if (!subId) return NextResponse.json({ error: 'サブスクリプションが見つかりません' }, { status: 400 })

      // 次回更新日を取得
      const sub = await stripe.subscriptions.retrieve(subId)
      const renewDate = new Date(sub.current_period_end * 1000)
      const today = new Date()
      const daysUntilRenew = Math.ceil((renewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // 20日前ルール：更新20日前を過ぎていたら次々回まで延長
      if (daysUntilRenew < 20) {
        return NextResponse.json({
          error: `解約は更新日の20日前までに申請が必要です。次回更新日（${renewDate.toLocaleDateString('ja-JP')}）まで${daysUntilRenew}日のため、次々回（翌月）の解約として受け付けます。`,
          code: 'too_late',
          renew_date: renewDate.toISOString(),
          days_until_renew: daysUntilRenew,
        }, { status: 400 })
      }

      // 期間末に解約予約
      await stripe.subscriptions.update(subId, { cancel_at_period_end: true })
      await supabase.from('profiles')
        .update({ subscription_status: 'cancelling', cancel_at: renewDate.toISOString() })
        .eq('id', user.id)

      return NextResponse.json({
        ok: true,
        cancel_at: renewDate.toISOString(),
        message: `解約を受け付けました。${renewDate.toLocaleDateString('ja-JP')}まで引き続きご利用いただけます。`,
      })
    }

    // ── 解約キャンセル（解約申請を取り消し）─────────────────
    if (type === 'reactivate') {
      const subId = profile.stripe_subscription_id
      if (!subId) return NextResponse.json({ error: 'サブスクリプションが見つかりません' }, { status: 400 })

      await stripe.subscriptions.update(subId, { cancel_at_period_end: false })
      await supabase.from('profiles')
        .update({ subscription_status: 'active', cancel_at: null })
        .eq('id', user.id)

      return NextResponse.json({ ok: true, message: '解約申請を取り消しました。引き続きご利用いただけます。' })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Redirect to billing profile
  return NextResponse.json({ message: 'Use /api/billing/profile for profile data' }, { status: 200 })
}
