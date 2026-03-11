import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/client'
import { parseLineWebhook, sendExecutionComplete } from '@/lib/line'

function verifyLineSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('SHA256', process.env.LINE_CHANNEL_SECRET!)
    .update(body).digest('base64')
  return hash === signature
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-line-signature') || ''

  if (!verifyLineSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const events = parseLineWebhook(JSON.parse(body))

  for (const event of events) {
    if (event.type !== 'postback' || !event.data) continue

    const params = new URLSearchParams(event.data)
    const action = params.get('action')
    const proposalId = params.get('id')

    if (!proposalId) continue

    // Get proposal + user's LINE ID
    const { data: proposal } = await supabase
      .from('ai_proposals')
      .select('*, profiles!inner(line_user_id)')
      .eq('id', proposalId)
      .single()

    if (!proposal) continue

    if (action === 'approve') {
      await supabase.from('ai_proposals').update({
        status: 'approved',
        approved_at: new Date().toISOString(),
      }).eq('id', proposalId)

      // Send execution complete notification
      if (event.userId) {
        await sendExecutionComplete(event.userId, `「${proposal.title}」を承認しました。自動実行を開始します。`)
      }
    } else if (action === 'reject') {
      await supabase.from('ai_proposals').update({ status: 'rejected' }).eq('id', proposalId)
    }
  }

  return NextResponse.json({ ok: true })
}
