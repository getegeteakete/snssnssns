import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'
import { sendDailyReport } from '@/lib/line'

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  // Get all users with LINE connected
  const { data: users } = await supabase
    .from('profiles')
    .select('id, line_user_id, plan')
    .not('line_user_id', 'is', null)
    .in('plan', ['pro', 'business', 'enterprise'])

  if (!users?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const user of users) {
    // Get yesterday's analytics
    const { data: analytics } = await supabase
      .from('analytics_snapshots')
      .select('metric_type, value')
      .eq('user_id', user.id)
      .eq('date', yesterday)

    const pv = analytics?.find(a => a.metric_type === 'page_views')?.value || 0
    const cv = analytics?.find(a => a.metric_type === 'conversions')?.value || 0
    const cvr = pv > 0 ? ((cv / pv) * 100).toFixed(2) : '0.00'

    // Check for anomalies
    const { data: proposals } = await supabase
      .from('ai_proposals')
      .select('title')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .eq('priority', 'high')
      .limit(1)

    await sendDailyReport(user.line_user_id!, {
      date: yesterday,
      pv: Number(pv),
      cv: Number(cv),
      cvr,
      alert: proposals?.[0]?.title,
    })
    sent++
  }

  return NextResponse.json({ sent, date: yesterday })
}
