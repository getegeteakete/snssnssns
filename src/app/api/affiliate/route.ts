import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/client'

const AIMO_REWARDS = {
  signup: 500,       // ¥500 per free signup
  paid_first: 0.20,  // 20% of first payment
  recurring: 0.05,   // 5% monthly recurring
}

// GET: affiliate dashboard data
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: conversions }, { data: ecPrograms }] = await Promise.all([
    supabase.from('profiles').select('affiliate_code, plan').eq('id', user.id).single(),
    supabase.from('affiliate_conversions')
      .select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('ec_programs').select('*, ec_affiliators(count)').eq('owner_id', user.id),
  ])

  const conversionList = (conversions || []) as any[]
  const totalEarned = conversionList.reduce((s: number, c: any) => s + (c.reward || 0), 0)
  const pendingReward = conversionList.filter((c: any) => c.status === 'pending').reduce((s: number, c: any) => s + (c.reward || 0), 0)

  return NextResponse.json({
    affiliate_code: profile?.affiliate_code,
    affiliate_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/register?ref=${profile?.affiliate_code}`,
    total_earned: totalEarned,
    pending_reward: pendingReward,
    conversions: conversions || [],
    ec_programs: ecPrograms || [],
    can_use_ec_affiliate: ['business', 'enterprise'].includes(profile?.plan || ''),
  })
}

// POST: create EC program or handle affiliate actions
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action } = body

  // Create EC affiliate program
  if (action === 'create_ec_program') {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    if (!['business', 'enterprise'].includes(profile?.plan || '')) {
      return NextResponse.json({ error: 'Businessプラン以上が必要です', code: 'plan_required' }, { status: 403 })
    }

    const { name, description, product_url, commission_type, commission_value, cookie_days } = body
    const { data, error } = await supabase.from('ec_programs').insert({
      owner_id: user.id, name, description, product_url,
      commission_type, commission_value, cookie_days: cookie_days || 30,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Approve/reject affiliator
  if (action === 'update_affiliator') {
    const { affiliator_id, status } = body
    const { error } = await supabase.from('ec_affiliators')
      .update({ status })
      .eq('id', affiliator_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
