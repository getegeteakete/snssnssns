import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'

// /api/affiliate/track?tag=abc123&to=https://example.com
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')
  const destination = searchParams.get('to')

  if (!tag || !destination) {
    return NextResponse.redirect(destination || process.env.NEXT_PUBLIC_APP_URL!)
  }

  // Log click
  const supabase = createAdminClient()
  await supabase.from('ec_affiliators')
    .update({ clicks: supabase.rpc('increment', { row_id: tag }) as any })
    .eq('unique_tag', tag)

  // Set affiliate cookie and redirect
  const response = NextResponse.redirect(destination)
  response.cookies.set('aimo_ref', tag, {
    maxAge: 30 * 24 * 60 * 60,
    httpOnly: true,
    sameSite: 'lax',
  })
  return response
}
