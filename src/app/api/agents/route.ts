import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { generateSnsPost, generateAiReply, generateGmbPost, generateProposal } from '@/lib/anthropic/agents'

const POINT_COSTS: Record<string, number> = {
  generate_post: 5,
  generate_reply: 2,
  generate_gmb: 5,
  generate_proposal: 3,
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action, params } = body

  // Check & deduct points
  const cost = POINT_COSTS[action] || 5
  const { data: profile } = await supabase.from('profiles').select('points, plan').eq('id', user.id).single()
  if (!profile || profile.points < cost) {
    return NextResponse.json({ error: 'ポイントが不足しています', code: 'insufficient_points' }, { status: 402 })
  }

  try {
    let result

    switch (action) {
      case 'generate_post':
        result = await generateSnsPost(params)
        break
      case 'generate_reply':
        result = await generateAiReply(params)
        break
      case 'generate_gmb':
        result = await generateGmbPost(params)
        break
      case 'generate_proposal':
        result = await generateProposal(params)
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    // Deduct points
    const newBalance = profile.points - cost
    await supabase.from('profiles').update({ points: newBalance }).eq('id', user.id)
    await supabase.from('point_transactions').insert({
      user_id: user.id, type: 'use', amount: -cost, balance_after: newBalance,
      description: `${action} (${params?.platform || params?.agentRole || ''})`
    })

    return NextResponse.json({ result, points_used: cost, points_remaining: newBalance })
  } catch (error: any) {
    console.error('Agent error:', error)
    return NextResponse.json({ error: 'AI処理に失敗しました', detail: error.message }, { status: 500 })
  }
}
