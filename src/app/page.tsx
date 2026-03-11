import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export default async function RootPage() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/dashboard')
  } catch {}
  redirect('/auth/register')
}
