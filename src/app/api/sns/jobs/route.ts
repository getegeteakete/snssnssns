import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('auto_engagement_jobs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check plan allows auto-engagement
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  if (!profile || profile.plan === 'free') {
    return NextResponse.json({ error: 'Starterプラン以上が必要です', code: 'plan_required' }, { status: 403 })
  }

  const body = await request.json()
  const { platform, job_type, target_type, target_value, daily_limit } = body

  const { data, error } = await supabase.from('auto_engagement_jobs').insert({
    user_id: user.id,
    platform, job_type, target_type, target_value,
    daily_limit: Math.min(daily_limit || 100, 300), // max 300/day safety cap
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, is_active, daily_limit } = await request.json()
  const updates: any = {}
  if (is_active !== undefined) updates.is_active = is_active
  if (daily_limit !== undefined) updates.daily_limit = Math.min(daily_limit, 300)

  const { error } = await supabase.from('auto_engagement_jobs')
    .update(updates).eq('id', id).eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await supabase.from('auto_engagement_jobs').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
