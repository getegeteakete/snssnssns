'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

const PLANS = [
  { id: 'starter', name: 'Starter', price: 3900, color: 'cyan', features: ['SNS投稿 月30件', 'AI生成 月30回', '基本分析', 'GMB月4件'] },
  { id: 'pro', name: 'Pro', price: 6900, color: 'amber', badge: '最人気', features: ['SNS投稿 月100件', 'AI生成 月60回', '画像生成 月20枚', 'LINE承認フロー', 'アフィリエイト機能', 'GMB月8件', '自動いいね・返信'] },
  { id: 'business', name: 'Business', price: 14800, color: 'purple', features: ['SNS投稿 月200件', 'AI生成 無制限', '画像生成 月50枚', '動画生成 月3本', '競合リサーチ', 'CMOエージェント全機能', 'GMB月30件', 'ECアフィリエイト管理', 'LINE承認フロー'] },
]

const POINT_PACKAGES = [
  { id: 'points_100', points: 100, price: 1000, label: '100pt', sublabel: '¥1,000' },
  { id: 'points_550', points: 550, price: 5000, label: '550pt', sublabel: '¥5,000 (9%OFF)', badge: 'お得' },
  { id: 'points_1200', points: 1200, price: 10000, label: '1,200pt', sublabel: '¥10,000 (17%OFF)', badge: '最安' },
]

function BillingInner() {
  const [currentPlan, setCurrentPlan] = useState('free')
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchProfile()
    if (searchParams.get('success')) toast.success('決済が完了しました！')
    if (searchParams.get('cancelled')) toast.error('決済がキャンセルされました')
  }, [])

  async function fetchProfile() {
    const r = await fetch('/api/stripe')
    // We'll get profile from Supabase directly via a simple endpoint
    const r2 = await fetch('/api/billing/profile')
    if (r2.ok) {
      const data = await r2.json()
      setCurrentPlan(data.plan)
      setPoints(data.points)
      setTransactions(data.transactions || [])
    }
  }

  async function handleSubscribe(planId: string) {
    setLoading(planId)
    const r = await fetch('/api/stripe', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'subscription', planId }) })
    const data = await r.json()
    if (r.ok && data.url) { window.location.href = data.url }
    else toast.error(data.error || '決済に失敗しました')
    setLoading(null)
  }

  async function handleBuyPoints(packageId: string) {
    setLoading(packageId)
    const r = await fetch('/api/stripe', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'points', packageId }) })
    const data = await r.json()
    if (r.ok && data.url) { window.location.href = data.url }
    else toast.error(data.error || '決済に失敗しました')
    setLoading(null)
  }

  const colorMap: Record<string, string> = {
    cyan: 'border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.04)]',
    amber: 'border-[rgba(255,184,0,0.4)] bg-[rgba(255,184,0,0.06)] shadow-[0_0_40px_rgba(255,184,0,0.08)]',
    purple: 'border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.04)]',
  }
  const btnColor: Record<string, string> = {
    cyan: 'bg-[#00d4ff] text-[#04040a] hover:bg-[#00bfe6]',
    amber: 'bg-[#ffb800] text-[#04040a] hover:bg-[#e09500]',
    purple: 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed]',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tighter">プラン・課金管理</h1>
        <p className="text-sm text-[#6b6b8a] mt-1">現在のプラン: <span className="text-[#ffb800] font-bold uppercase">{currentPlan}</span> / 残ポイント: <span className="text-[#ffb800] font-bold">{points}pt</span></p>
      </div>

      {/* Plan cards */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4">サブスクリプションプラン</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => (
            <div key={plan.id} className={`relative border rounded-2xl p-6 flex flex-col ${colorMap[plan.color]}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ffb800] text-[#04040a] text-[10px] font-bold px-4 py-1 rounded-full">{plan.badge}</div>
              )}
              <div className="mb-4">
                <div className="font-display text-lg font-extrabold">{plan.name}</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-display text-3xl font-extrabold">¥{plan.price.toLocaleString()}</span>
                  <span className="text-xs text-[#6b6b8a]">/月</span>
                </div>
              </div>
              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[#9898b8]">
                    <span className="text-[#00e5a0]">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id || currentPlan === plan.id}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${btnColor[plan.color]} ${currentPlan === plan.id ? 'opacity-50 cursor-default' : ''}`}>
                {loading === plan.id ? '処理中...' : currentPlan === plan.id ? '現在のプラン' : 'このプランにする'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Point packages */}
      <div>
        <h2 className="font-display text-lg font-bold mb-2">ポイントチャージ</h2>
        <p className="text-xs text-[#6b6b8a] mb-4">AI生成・投稿・分析に使用するポイントを追加購入できます</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {POINT_PACKAGES.map(pkg => (
            <div key={pkg.id} className="card-hover relative">
              {pkg.badge && (
                <div className="absolute -top-2.5 right-4 bg-[#00e5a0] text-[#04040a] text-[9px] font-bold px-3 py-0.5 rounded-full">{pkg.badge}</div>
              )}
              <div className="font-display text-2xl font-extrabold text-[#ffb800]">{pkg.label}</div>
              <div className="text-sm text-[#6b6b8a] mt-1">{pkg.sublabel}</div>
              <button onClick={() => handleBuyPoints(pkg.id)} disabled={loading === pkg.id}
                className="w-full mt-4 btn-primary justify-center py-2.5 text-sm disabled:opacity-50">
                {loading === pkg.id ? '処理中...' : '購入する'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div className="card">
          <h2 className="font-display text-base font-bold mb-4">利用履歴</h2>
          <div className="space-y-2">
            {transactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-[#1a1a2e] last:border-0">
                <div>
                  <div className="text-sm text-[#e8e8f4]">{t.description}</div>
                  <div className="text-xs text-[#6b6b8a]">{new Date(t.created_at).toLocaleDateString('ja-JP')}</div>
                </div>
                <div className={`font-display text-base font-bold ${t.amount > 0 ? 'text-[#00e5a0]' : 'text-[#6b6b8a]'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount}pt
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BillingPage() {
  return <Suspense fallback={<div className="p-6 text-[#6b6b8a]">読み込み中...</div>}><BillingInner /></Suspense>
}
