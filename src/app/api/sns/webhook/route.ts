import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/client'
import { generateAiReply } from '@/lib/anthropic/agents'
import { nanoid } from 'nanoid'

// Called by SNS platform webhooks (Instagram, Twitter)
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { platform, user_id, event_type, sender_id, sender_name, text, post_id, comment_id } = body
  const supabase = createAdminClient() as any

  const { data: triggers } = await supabase
    .from('keyword_triggers').select('*')
    .eq('user_id', user_id).eq('platform', platform).eq('is_active', true)

  let keywordMatched = false
  if (triggers) {
    for (const trigger of triggers) {
      if (!trigger.trigger_type?.includes?.(event_type) && trigger.trigger_type !== event_type) continue
      const lowerText = text.toLowerCase()
      const matched = (trigger.keywords as string[]).find(kw => lowerText.includes(kw.toLowerCase()))
      if (!matched) continue
      keywordMatched = true

      const token = nanoid(12)
      const issuedUrl = trigger.destination_url
        ? `${trigger.destination_url}?ref=${token}&from=${sender_id}` : null

      let reply = trigger.reply_template
      if (issuedUrl) reply = reply.replace('{URL}', issuedUrl).replace('{NAME}', sender_name || 'さん')

      await supabase.from('trigger_logs').insert({
        trigger_id: trigger.id, user_id, platform,
        sender_id, sender_name, matched_keyword: matched,
        reply_sent: reply, issued_url: issuedUrl, unique_token: token,
      })
      await supabase.from('keyword_triggers')
        .update({ triggered_count: (trigger.triggered_count || 0) + 1 }).eq('id', trigger.id)
    }
  }

  if (!keywordMatched) {
    const { data: aiSettings } = await supabase
      .from('ai_reply_settings').select('*').eq('user_id', user_id).single()

    if (aiSettings?.is_active) {
      const result = await generateAiReply({
        originalText: text, senderName: sender_name,
        brandTone: aiSettings.brand_tone || '丁寧でフレンドリー', platform,
      }).catch(() => null)

      if (result?.reply) {
        const isAutoMode = aiSettings.mode === 'auto' ||
          (aiSettings.mode === 'hybrid' && (aiSettings.auto_types || []).includes(result.type))
        await supabase.from('ai_reply_queue').insert({
          user_id, platform, comment_id: comment_id || nanoid(),
          post_id, sender_id, sender_name, original_text: text,
          ai_reply: result.reply, reply_type: result.type,
          status: isAutoMode ? 'auto_sent' : 'pending',
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}

// GET: list AI reply queue for logged-in user
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'

  const { data } = await supabase.from('ai_reply_queue')
    .select('*').eq('user_id', user.id).eq('status', status)
    .order('created_at', { ascending: false }).limit(50)

  return NextResponse.json(data || [])
}

// PATCH: approve/reject AI reply
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await request.json()
  const { error } = await supabase.from('ai_reply_queue')
    .update({ status, sent_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
