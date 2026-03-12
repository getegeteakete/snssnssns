import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const platform = searchParams.get('platform')

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=oauth_denied', request.url))
  }

  let userId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
    userId = decoded.userId
  } catch {
    return NextResponse.redirect(new URL('/dashboard/settings?error=invalid_state', request.url))
  }

  const supabase = createAdminClient() as any
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sns-callback?platform=${platform}`

  try {
    let accessToken = '', accountId = '', accountName = '', refreshToken = ''

    if (platform === 'twitter') {
      const res = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code', code,
          redirect_uri: redirectUri, code_verifier: 'challenge',
        }),
      })
      const data = await res.json()
      accessToken = data.access_token
      refreshToken = data.refresh_token || ''

      // Get user info
      const me = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(r => r.json())
      accountId = me.data?.id || ''
      accountName = me.data?.username || ''
    }

    if (platform === 'instagram' || platform === 'facebook') {
      const res = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: process.env.META_APP_ID!,
          client_secret: process.env.META_APP_SECRET!,
          redirect_uri: redirectUri,
          code,
        }),
      })
      const data = await res.json()
      accessToken = data.access_token

      const me = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name`).then(r => r.json())
      accountId = me.id || ''
      accountName = me.name || ''
    }

    if (platform === 'gmb') {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code, client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri, grant_type: 'authorization_code',
        }),
      })
      const data = await res.json()
      accessToken = data.access_token
      refreshToken = data.refresh_token || ''

      const me = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(r => r.json())
      accountId = me.id || ''
      accountName = me.email || ''
    }

    // Save to sns_accounts
    await supabase.from('sns_accounts').upsert({
      user_id: userId,
      platform: platform === 'instagram' ? 'instagram' : platform === 'gmb' ? 'gmb' : platform,
      account_id: accountId,
      account_name: accountName,
      access_token: accessToken,
      refresh_token: refreshToken || null,
      is_active: true,
    }, { onConflict: 'user_id,platform,account_id' })

    return NextResponse.redirect(new URL('/dashboard/settings?success=connected&platform=' + platform, request.url))
  } catch (e: any) {
    console.error('OAuth callback error:', e)
    return NextResponse.redirect(new URL('/dashboard/settings?error=oauth_failed', request.url))
  }
}
