import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { generateGmbPost } from '@/lib/anthropic/agents'

const GMB_API = 'https://mybusiness.googleapis.com/v4'

// POST GMB post to Google Business Profile API
async function publishToGmb(accessToken: string, locationId: string, post: {
  content: string; post_type: string; cta_type?: string; cta_url?: string
  event_start?: string; event_end?: string; title?: string
}) {
  const body: any = { summary: post.content }

  if (post.post_type === 'event' && post.event_start) {
    body.event = {
      title: post.title || 'イベント',
      schedule: {
        startDate: post.event_start?.split('T')[0],
        endDate: (post.event_end || post.event_start)?.split('T')[0],
      }
    }
  }
  if (post.cta_type && post.cta_url) {
    body.callToAction = { actionType: post.cta_type, url: post.cta_url }
  }

  const res = await fetch(`${GMB_API}/accounts/-/locations/${locationId}/localPosts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GMB API error: ${await res.text()}`)
  return res.json()
}

export async function GET(request: NextRequest) {
  const supabase = (createServerSupabaseClient() as any)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('gmb_posts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const supabase = (createServerSupabaseClient() as any)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action } = body

  // AI generate GMB post
  if (action === 'generate') {
    const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single()
    if (!profile || profile.points < 5) {
      return NextResponse.json({ error: 'ポイントが不足しています' }, { status: 402 })
    }
    const result = await generateGmbPost(body.params)
    const newBalance = profile.points - 5
    await supabase.from('profiles').update({ points: newBalance }).eq('id', user.id)
    await supabase.from('point_transactions').insert({
      user_id: user.id, type: 'use', amount: -5, balance_after: newBalance,
      description: 'GMB投稿生成'
    })
    return NextResponse.json({ result, points_remaining: newBalance })
  }

  // Save draft / schedule
  if (action === 'save') {
    const { location_id, location_name, post_type, title, content,
            cta_type, cta_url, event_start, event_end, scheduled_at } = body

    const { data, error } = await supabase.from('gmb_posts').insert({
      user_id: user.id,
      location_id, location_name, post_type, title, content,
      cta_type, cta_url, event_start, event_end,
      scheduled_at,
      status: scheduled_at ? 'scheduled' : 'draft',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Publish immediately
  if (action === 'publish') {
    const { post_id } = body
    const { data: post } = await supabase.from('gmb_posts').select('*').eq('id', post_id).single()
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // Get GMB access token from SNS accounts
    const { data: account } = await supabase.from('sns_accounts')
      .select('access_token').eq('user_id', user.id).eq('platform', 'gmb').single()

    if (!account?.access_token) {
      return NextResponse.json({ error: 'Googleアカウントが連携されていません' }, { status: 400 })
    }

    try {
      const gmb = await publishToGmb(account.access_token, post.location_id, post)
      await supabase.from('gmb_posts').update({
        status: 'published',
        published_at: new Date().toISOString(),
        gmb_post_name: gmb.name,
      }).eq('id', post_id)
      return NextResponse.json({ ok: true, gmb_name: gmb.name })
    } catch (err: any) {
      await supabase.from('gmb_posts').update({ status: 'failed' }).eq('id', post_id)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
