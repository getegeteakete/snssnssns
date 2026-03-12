import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const clientId = process.env.TWITTER_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=twitter_not_configured', request.url))
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sns-callback?platform=twitter`
  const scope = 'tweet.read tweet.write users.read offline.access'
  const state = Buffer.from(JSON.stringify({ userId: user.id, platform: 'twitter' })).toString('base64')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: 'challenge',
    code_challenge_method: 'plain',
  })

  return NextResponse.redirect(`https://twitter.com/i/oauth2/authorize?${params}`)
}
