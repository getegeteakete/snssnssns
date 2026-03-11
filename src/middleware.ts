import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const { pathname } = request.nextUrl

  // If env vars not set yet, allow through (shows config error page instead of crash)
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name) { return request.cookies.get(name)?.value },
      set(name, value, options) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value, ...options })
      },
      remove(name, options) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (pathname.startsWith('/dashboard') && !user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    if (pathname.startsWith('/auth') && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } catch {
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
