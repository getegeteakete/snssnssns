import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const ref = requestUrl.searchParams.get('ref')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: any) { try { cookieStore.set({ name, value, ...options }) } catch {} },
          remove(name: string, options: any) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
        },
      }
    )

    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Apply referral code for Google OAuth registrations
    if (data.user && ref) {
      await supabase.from('profiles').update({ referred_by: ref }).eq('id', data.user.id)
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
