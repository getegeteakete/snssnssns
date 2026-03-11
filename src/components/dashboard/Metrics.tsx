'use client'
import type { AnalyticsSnapshot } from '@/types/database'

interface Props { analytics: any[] }

function sumMetric(analytics: any[], metric: string) {
  return analytics.filter(a => a.metric_type === metric).reduce((s, a) => s + Number(a.value), 0)
}

export default function DashboardMetrics({ analytics }: Props) {
  const totalPV      = sumMetric(analytics, 'page_views')
  const totalCV      = sumMetric(analytics, 'conversions')
  const totalClicks  = sumMetric(analytics, 'clicks')
  const cvr          = totalPV > 0 ? ((totalCV / totalPV) * 100).toFixed(2) : '0.00'

  const metrics = [
    { label: '月間PV',       value: totalPV.toLocaleString(),     unit: '', color: 'text-[#00d4ff]', change: '+12%' },
    { label: '月間CV数',     value: totalCV.toLocaleString(),      unit: '件', color: 'text-[#00e5a0]', change: '+34%' },
    { label: '平均CVR',      value: cvr,                          unit: '%', color: 'text-[#ffb800]', change: '+0.8pt' },
    { label: '月間クリック', value: totalClicks.toLocaleString(), unit: '回', color: 'text-[#8b5cf6]', change: '+18%' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map(m => (
        <div key={m.label} className="card-hover">
          <div className="text-xs text-[#6b6b8a] mb-2 font-medium">{m.label}</div>
          <div className={`font-display text-3xl font-extrabold tracking-tighter ${m.color}`}>
            {m.value}<span className="text-base font-normal text-[#6b6b8a] ml-0.5">{m.unit}</span>
          </div>
          <div className="text-xs text-[#00e5a0] mt-1.5 flex items-center gap-1">
            <span>▲</span>{m.change}
            <span className="text-[#6b6b8a] ml-1">先月比</span>
          </div>
        </div>
      ))}
    </div>
  )
}
