'use client'
import Link from 'next/link'
import type { Profile } from '@/types/database'

export default function DashboardHeader({ profile }: { profile: Profile | null }) {
  return (
    <header className="h-14 bg-[#04040a] border-b border-[#1a1a2e] flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2 text-[#6b6b8a] text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-pulse-dot"/>
        <span>5体のAIエージェントが稼働中</span>
      </div>
      <div className="flex items-center gap-3">
        {/* Points */}
        <div className="flex items-center gap-1.5 bg-[rgba(255,184,0,0.08)] border border-[rgba(255,184,0,0.2)] rounded-full px-3 py-1">
          <span className="text-[10px] text-[#6b6b8a]">残ポイント</span>
          <span className="text-sm font-bold text-[#ffb800]">{profile?.points ?? 0}pt</span>
        </div>
        {/* Buy points */}
        <Link href="/dashboard/billing" className="btn-primary text-xs py-1.5 px-4">
          チャージ
        </Link>
      </div>
    </header>
  )
}
