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

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Redirect to billing profile
  return NextResponse.json({ message: 'Use /api/billing/profile for profile data' }, { status: 200 })
}
