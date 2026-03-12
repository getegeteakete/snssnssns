import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=gmb_not_configured', request.url))
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sns-callback?platform=gmb`
  const state = Buffer.from(JSON.stringify({ userId: user.id, platform: 'gmb' })).toString('base64')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'https://www.googleapis.com/auth/business.manage',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
