import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export default async function RootPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')
  // Serve LP from static file (index.html) - redirect to /lp or just serve inline
  redirect('/lp')
}
