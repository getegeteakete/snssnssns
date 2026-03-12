import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const clientId = process.env.META_APP_ID
  if (!clientId) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=instagram_not_configured', request.url))
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sns-callback?platform=instagram`
  const state = Buffer.from(JSON.stringify({ userId: user.id, platform: 'instagram' })).toString('base64')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
    response_type: 'code',
    state,
  })

  return NextResponse.redirect(`https://www.facebook.com/v18.0/dialog/oauth?${params}`)
}
