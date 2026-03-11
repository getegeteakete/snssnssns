import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const supabase = (createServerSupabaseClient() as any)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('plan, points, stripe_subscription_id, subscription_status').eq('id', user.id).single(),
    supabase.from('point_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ])

  return NextResponse.json({ ...profile, transactions: transactions || [] })
}
