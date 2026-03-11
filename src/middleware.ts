import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // env vars未設定 or /auth/* → そのまま通す（ログインページを表示）
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) { return request.cookies.get(name)?.value },
      set(name: string, value: string, options: any) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  try {
    const { data: { user } } = await supabase.auth.getUser()
    // ダッシュボードに未ログインでアクセス → ログインへ
    if (pathname.startsWith('/dashboard') && !user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    // ログイン済みで /auth/* にアクセス → ダッシュボードへ
    if (pathname.startsWith('/auth') && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch {
    // エラー時は /dashboard のみ保護、/auth/* はそのまま通す
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
