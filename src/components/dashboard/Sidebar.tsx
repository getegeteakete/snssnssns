'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/database'

const navItems = [
  { href: '/dashboard',            label: 'ダッシュボード', icon: '◈' },
  { href: '/dashboard/agents',     label: 'AIエージェント', icon: '⬡' },
  { href: '/dashboard/sns',        label: 'SNS自動化',      icon: '◎' },
  { href: '/dashboard/gmb',        label: 'Googleマイビジネス', icon: '◉' },
  { href: '/dashboard/analytics',  label: '分析・レポート', icon: '◇' },
  { href: '/dashboard/affiliate',  label: 'アフィリエイト', icon: '◆' },
  { href: '/dashboard/billing',    label: 'プラン・課金',   icon: '◑' },
  { href: '/dashboard/settings',   label: '設定',           icon: '◌' },
]

const planColors: Record<string, string> = {
  free: 'text-[#6b6b8a] border-[#252540]',
  starter: 'text-[#00d4ff] border-[rgba(0,212,255,0.3)]',
  pro: 'text-[#ffb800] border-[rgba(255,184,0,0.3)]',
  business: 'text-[#8b5cf6] border-[rgba(139,92,246,0.3)]',
  enterprise: 'text-[#00e5a0] border-[rgba(0,229,160,0.3)]',
}

export default function DashboardSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-60 h-screen bg-[#0a0a14] border-r border-[#1a1a2e] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1a1a2e]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#00d4ff] rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" stroke="#04040a" strokeWidth="1.6" strokeLinecap="round" width={14} height={14}>
              <path d="M2 13 L8 3 L14 13 M5 9.5 L11 9.5"/>
            </svg>
          </div>
          <span className="font-display text-lg font-extrabold tracking-tighter">AIMO</span>
        </Link>
      </div>

      {/* Plan badge + points */}
      {profile && (
        <div className="px-5 py-4 border-b border-[#1a1a2e]">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-bold tracking-widest uppercase border rounded-full px-2.5 py-0.5 ${planColors[profile.plan] || planColors.free}`}>
              {profile.plan}
            </span>
            <span className="text-xs text-[#6b6b8a]">残り <span className="text-[#ffb800] font-bold">{profile.points}pt</span></span>
          </div>
          <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#ffb800] rounded-full transition-all"
              style={{ width: `${Math.min((profile.points / 100) * 100, 100)}%` }}/>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-all duration-150
                ${active
                  ? 'bg-[rgba(0,212,255,0.08)] text-[#00d4ff] border border-[rgba(0,212,255,0.15)]'
                  : 'text-[#6b6b8a] hover:text-[#e8e8f4] hover:bg-[rgba(255,255,255,0.04)]'
                }`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.href === '/dashboard/agents' && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-pulse-dot"/>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + Sign out */}
      <div className="px-4 py-4 border-t border-[#1a1a2e]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center text-xs font-bold text-[#00d4ff]">
            {profile?.full_name?.[0] || profile?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[#e8e8f4] truncate">{profile?.full_name || 'ユーザー'}</div>
            <div className="text-[10px] text-[#6b6b8a] truncate">{profile?.email}</div>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="w-full text-left text-xs text-[#6b6b8a] hover:text-[#ff4560] transition-colors px-3 py-1.5 rounded-lg hover:bg-[rgba(255,69,96,0.06)]">
          ログアウト
        </button>
      </div>
    </aside>
  )
}
