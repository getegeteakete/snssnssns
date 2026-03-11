import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { generateProposal } from '@/lib/anthropic/agents'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || '30d'
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: snapshots } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', since)
    .order('date', { ascending: true })

  if (!snapshots || snapshots.length === 0) {
    return NextResponse.json({
      total_pv: 0, total_cv: 0, cvr: '0.00', total_reach: 0,
      daily_pv: [], platform_breakdown: [], ai_insights: ['データが蓄積されるとここにAIインサイトが表示されます。'],
    })
  }

  // Aggregate
  const byDate: Record<string, any> = {}
  let totalPV = 0, totalCV = 0, totalReach = 0
  const platformMap: Record<string, number> = {}

  for (const s of snapshots) {
    if (!byDate[s.date]) byDate[s.date] = { date: s.date.slice(5), pv: 0, cv: 0 }
    if (s.metric_type === 'page_views') { totalPV += Number(s.value); byDate[s.date].pv += Number(s.value) }
    if (s.metric_type === 'conversions') { totalCV += Number(s.value); byDate[s.date].cv += Number(s.value) }
    if (s.metric_type === 'reach') totalReach += Number(s.value)
    if (['twitter','instagram','facebook','line','gmb'].includes(s.platform)) {
      platformMap[s.platform] = (platformMap[s.platform] || 0) + Number(s.value)
    }
  }

  const cvr = totalPV > 0 ? ((totalCV / totalPV) * 100).toFixed(2) : '0.00'
  const platformBreakdown = Object.entries(platformMap).map(([platform, visits]) => ({ platform, visits }))

  // Generate AI insights (use cached if recently generated)
  let aiInsights: string[] = []
  try {
    const summary = `PV: ${totalPV}, CV: ${totalCV}, CVR: ${cvr}%, 期間: ${range}, 媒体別流入: ${JSON.stringify(platformBreakdown)}`
    const result = await generateProposal({ analyticsData: summary, agentRole: 'analytics' })
    if (result.recommendation) aiInsights = [result.insight, result.recommendation]
  } catch {}

  return NextResponse.json({
    total_pv: totalPV, total_cv: totalCV, cvr, total_reach: totalReach,
    daily_pv: Object.values(byDate),
    platform_breakdown: platformBreakdown,
    ai_insights: aiInsights.length > 0 ? aiInsights : ['分析データを蓄積中です。'],
  })
}
