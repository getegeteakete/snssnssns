import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/client'

// GET: list triggers for current user
export async function GET(request: NextRequest) {
  const supabase = (createServerSupabaseClient() as any)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('keyword_triggers')
    .select('*, trigger_logs(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: create trigger
export async function POST(request: NextRequest) {
  const supabase = (createServerSupabaseClient() as any)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { platform, trigger_type, keywords, reply_template, url_type, destination_url } = body

  const { data, error } = await supabase.from('keyword_triggers').insert({
    user_id: user.id,
    platform, trigger_type,
    keywords: Array.isArray(keywords) ? keywords : keywords.split(',').map((k: string) => k.trim()),
    reply_template, url_type, destination_url,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH: toggle active
export async function PATCH(request: NextRequest) {
  const supabase = (createServerSupabaseClient() as any)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, is_active } = await request.json()
  const { error } = await supabase.from('keyword_triggers')
    .update({ is_active })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE: remove trigger
export async function DELETE(request: NextRequest) {
  const supabase = (createServerSupabaseClient() as any)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  const { error } = await supabase.from('keyword_triggers')
    .delete().eq('id', id).eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
