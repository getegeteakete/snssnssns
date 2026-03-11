import { createServerSupabaseClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import DashboardMetrics from '@/components/dashboard/Metrics'
import ProposalFeed from '@/components/dashboard/ProposalFeed'
import RecentPosts from '@/components/dashboard/RecentPosts'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: profile },
    { data: proposals },
    { data: recentPosts },
    { data: analytics },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('ai_proposals').select('*').eq('user_id', user.id)
      .eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('posts').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('analytics_snapshots').select('*').eq('user_id', user.id)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .order('date', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tighter">
          おはようございます、{profile?.full_name?.split(' ')[0] || 'さん'} 👋
        </h1>
        <p className="text-sm text-[#6b6b8a] mt-1">今日も売上を作りにいきましょう</p>
      </div>

      {/* Metric cards */}
      <DashboardMetrics analytics={analytics || []} />

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI proposals */}
        <ProposalFeed proposals={proposals || []} />
        {/* Recent posts */}
        <RecentPosts posts={recentPosts || []} />
      </div>
    </div>
  )
}
