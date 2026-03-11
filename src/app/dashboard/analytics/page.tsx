'use client'
import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => { fetchAnalytics() }, [range])

  async function fetchAnalytics() {
    const r = await fetch(`/api/analytics?range=${range}`)
    if (r.ok) setData(await r.json())
  }

  const customTooltipStyle = { background: '#0f0f1e', border: '1px solid #1a1a2e', borderRadius: 8, fontSize: 11 }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tighter">分析・レポート</h1>
          <p className="text-sm text-[#6b6b8a] mt-1">AIが毎日データを集計・分析します</p>
        </div>
        <div className="flex gap-2">
          {(['7d','30d','90d'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${range === r ? 'bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border-[rgba(0,212,255,0.3)]' : 'text-[#6b6b8a] border-[#1a1a2e]'}`}>
              {r === '7d' ? '7日' : r === '30d' ? '30日' : '90日'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'アクセス (PV)', value: data?.total_pv?.toLocaleString() || '—', change: data?.pv_change, color: 'text-[#00d4ff]' },
          { label: 'CV数', value: data?.total_cv || '—', change: data?.cv_change, color: 'text-[#00e5a0]' },
          { label: 'CVR', value: data?.cvr ? `${data.cvr}%` : '—', change: data?.cvr_change, color: 'text-[#ffb800]' },
          { label: 'SNS総リーチ', value: data?.total_reach?.toLocaleString() || '—', change: data?.reach_change, color: 'text-[#8b5cf6]' },
        ].map(k => (
          <div key={k.label} className="card-hover">
            <div className="text-xs text-[#6b6b8a] mb-2">{k.label}</div>
            <div className={`font-display text-3xl font-extrabold ${k.color}`}>{k.value}</div>
            {k.change && (
              <div className={`text-xs mt-1 flex items-center gap-1 ${k.change > 0 ? 'text-[#00e5a0]' : 'text-[#ff4560]'}`}>
                {k.change > 0 ? '▲' : '▼'} {Math.abs(k.change)}%
                <span className="text-[#6b6b8a]">前期比</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PV/CV chart */}
        <div className="card">
          <h2 className="font-display text-sm font-bold mb-4">アクセス・CV推移</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.daily_pv || []}>
              <XAxis dataKey="date" tick={{ fill: '#6b6b8a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6b8a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Line type="monotone" dataKey="pv" stroke="#00d4ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cv" stroke="#00e5a0" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform breakdown */}
        <div className="card">
          <h2 className="font-display text-sm font-bold mb-4">媒体別流入</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.platform_breakdown || []}>
              <XAxis dataKey="platform" tick={{ fill: '#6b6b8a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b6b8a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="visits" fill="#00d4ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI insights */}
      {data?.ai_insights && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#ffb800] animate-pulse-dot"/>
            <h2 className="font-display text-sm font-bold">AIインサイト</h2>
          </div>
          <div className="space-y-3">
            {data.ai_insights.map((insight: any, i: number) => (
              <div key={i} className="flex gap-3 p-3 bg-[#0f0f1e] rounded-xl border border-[#1a1a2e]">
                <div className="w-6 h-6 rounded-lg bg-[rgba(255,184,0,0.1)] border border-[rgba(255,184,0,0.2)] flex items-center justify-center flex-shrink-0 text-xs text-[#ffb800] font-bold">{i + 1}</div>
                <div className="text-xs text-[#9898b8] leading-relaxed">{insight}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
