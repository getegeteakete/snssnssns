import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import DashboardSidebar from '@/components/dashboard/Sidebar'
import DashboardHeader from '@/components/dashboard/Header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="flex h-screen bg-[#04040a] overflow-hidden">
      <DashboardSidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
