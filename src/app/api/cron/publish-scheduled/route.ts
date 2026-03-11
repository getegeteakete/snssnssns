import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // Get scheduled posts due to publish
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(20)

  // Get scheduled GMB posts
  const { data: gmbPosts } = await supabase
    .from('gmb_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(10)

  let publishedPosts = 0, publishedGmb = 0

  // Publish SNS posts
  for (const post of posts || []) {
    try {
      // TODO: call platform API (Twitter/Instagram) to actually publish
      // For now, mark as published
      await supabase.from('posts').update({
        status: 'published',
        published_at: new Date().toISOString(),
      }).eq('id', post.id)
      publishedPosts++
    } catch (err) {
      await supabase.from('posts').update({ status: 'failed' }).eq('id', post.id)
    }
  }

  // Publish GMB posts
  for (const post of gmbPosts || []) {
    try {
      // Get user's GMB token
      const { data: account } = await supabase.from('sns_accounts')
        .select('access_token')
        .eq('user_id', post.user_id)
        .eq('platform', 'gmb')
        .single()

      if (account?.access_token) {
        // Call GMB API to publish
        const res = await fetch(`https://mybusiness.googleapis.com/v4/accounts/-/locations/${post.location_id}/localPosts`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: post.content }),
        })
        if (res.ok) {
          const gmb = await res.json()
          await supabase.from('gmb_posts').update({ status: 'published', published_at: new Date().toISOString(), gmb_post_name: gmb.name }).eq('id', post.id)
          publishedGmb++
        }
      }
    } catch {
      await supabase.from('gmb_posts').update({ status: 'failed' }).eq('id', post.id)
    }
  }

  return NextResponse.json({ publishedPosts, publishedGmb, timestamp: now })
}
