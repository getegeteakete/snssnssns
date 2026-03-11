import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'
import { generateAiReply } from '@/lib/anthropic/agents'
import { nanoid } from 'nanoid'

// Called by SNS platform webhooks (Instagram, Twitter)
// Platform verifies its own signature before hitting this endpoint
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { platform, user_id, event_type, sender_id, sender_name, text, post_id, comment_id } = body

  const supabase = (createAdminClient() as any)

  // 1. Find active keyword triggers for this user+platform
  const { data: triggers } = await supabase
    .from('keyword_triggers')
    .select('*')
    .eq('user_id', user_id)
    .eq('platform', platform)
    .eq('is_active', true)
    .contains('trigger_type', [event_type]) // comment, dm, mention

  // 2. Check keyword matches
  let keywordMatched = false
  if (triggers) {
    for (const trigger of triggers) {
      const lowerText = text.toLowerCase()
      const matched = (trigger.keywords as string[]).find(kw => lowerText.includes(kw.toLowerCase()))
      if (!matched) continue
      keywordMatched = true

      // Generate unique token for URL
      const token = nanoid(12)
      const issuedUrl = trigger.destination_url
        ? `${trigger.destination_url}?ref=${token}&from=${sender_id}`
        : null

      // Build reply with URL
      let reply = trigger.reply_template
      if (issuedUrl) reply = reply.replace('{URL}', issuedUrl).replace('{NAME}', sender_name || 'さん')
      if (!reply.includes(issuedUrl || '')) reply += issuedUrl ? `\n${issuedUrl}` : ''

      // Log the trigger
      await supabase.from('trigger_logs').insert({
        trigger_id: trigger.id,
        user_id,
        platform,
        sender_id,
        sender_name,
        matched_keyword: matched,
        reply_sent: reply,
        issued_url: issuedUrl,
        unique_token: token,
      })

      // Update trigger count
      await supabase.from('keyword_triggers')
        .update({ triggered_count: (trigger.triggered_count || 0) + 1 })
        .eq('id', trigger.id)

      // TODO: Send reply via platform API (Twitter/Instagram)
      // await sendPlatformReply(platform, sender_id, comment_id, reply)
    }
  }

  // 3. AI auto-reply (if no keyword match or ai_reply_settings active)
  if (!keywordMatched) {
    const { data: aiSettings } = await supabase
      .from('ai_reply_settings')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (aiSettings?.is_active) {
      // Generate AI reply
      const result = await generateAiReply({
        originalText: text,
        senderName: sender_name,
        brandTone: aiSettings.brand_tone || '丁寧でフレンドリー',
        platform,
      }).catch(() => null)

      if (result?.reply) {
        const isAutoMode = aiSettings.mode === 'auto' ||
          (aiSettings.mode === 'hybrid' && (aiSettings.auto_types || []).includes(result.type))

        await supabase.from('ai_reply_queue').insert({
          user_id,
          platform,
          comment_id: comment_id || nanoid(),
          post_id,
          sender_id,
          sender_name,
          original_text: text,
          ai_reply: result.reply,
          reply_type: result.type,
          status: isAutoMode ? 'auto_sent' : 'pending',
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}

// GET: list AI reply queue
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const status = searchParams.get('status') || 'pending'

  const supabase = (createAdminClient() as any)
  const { data } = await supabase
    .from('ai_reply_queue')
    .select('*')
    .eq('user_id', userId!)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data || [])
}
