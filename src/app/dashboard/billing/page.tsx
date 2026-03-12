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
  const [cancelAt, setCancelAt] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchProfile()
    if (searchParams.get('success')) toast.success('決済が完了しました！')
    if (searchParams.get('cancelled')) toast.error('決済がキャンセルされました')
  }, [])

  async function fetchProfile() {
    const r2 = await fetch('/api/billing/profile')
    if (r2.ok) {
      const data = await r2.json()
      setCurrentPlan(data.plan)
      setPoints(data.points)
      setTransactions(data.transactions || [])
      setCancelAt(data.cancel_at || null)
      setSubscriptionStatus(data.subscription_status || null)
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

  async function handleCancel() {
    setCancelLoading(true)
    const r = await fetch('/api/stripe', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cancel' }) })
    const data = await r.json()
    if (r.ok) {
      toast.success(data.message)
      setCancelAt(data.cancel_at)
      setSubscriptionStatus('cancelling')
      setShowCancelModal(false)
    } else {
      toast.error(data.error || '解約処理に失敗しました')
      setShowCancelModal(false)
    }
    setCancelLoading(false)
  }

  async function handleReactivate() {
    setCancelLoading(true)
    const r = await fetch('/api/stripe', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'reactivate' }) })
    const data = await r.json()
    if (r.ok) {
      toast.success(data.message)
      setCancelAt(null)
      setSubscriptionStatus('active')
    } else {
      toast.error(data.error || '処理に失敗しました')
    }
    setCancelLoading(false)
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

  const isCancelling = subscriptionStatus === 'cancelling'
  const isPaid = currentPlan !== 'free'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tighter">プラン・課金管理</h1>
        <p className="text-sm text-[#6b6b8a] mt-1">現在のプラン: <span className="text-[#ffb800] font-bold uppercase">{currentPlan}</span> / 残ポイント: <span className="text-[#ffb800] font-bold">{points}pt</span></p>
      </div>

      {/* 解約予定バナー */}
      {isCancelling && cancelAt && (
        <div className="border border-[rgba(255,69,96,0.3)] bg-[rgba(255,69,96,0.06)] rounded-2xl p-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#ff4560] text-sm font-bold">⚠ 解約申請済み</span>
            </div>
            <p className="text-xs text-[#9898b8]">
              {new Date(cancelAt).toLocaleDateString('ja-JP')} をもってサービスが終了します。<br />
              それまで引き続き全機能をご利用いただけます。
            </p>
          </div>
          <button onClick={handleReactivate} disabled={cancelLoading}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border border-[rgba(0,229,160,0.3)] text-[#00e5a0] hover:bg-[rgba(0,229,160,0.08)] transition-all disabled:opacity-50">
            {cancelLoading ? '処理中...' : '解約を取り消す'}
          </button>
        </div>
      )}

      {/* 解約ポリシー説明 */}
      {isPaid && !isCancelling && (
        <div className="border border-[#1a1a2e] rounded-xl p-4 flex items-center gap-3 text-xs text-[#6b6b8a]">
          <span className="text-[#ffb800] text-base">ℹ</span>
          <span>解約は<span className="text-[#e8e8f4] font-medium">更新日の20日前まで</span>に申請が必要です。申請後も期間終了日まで全機能をご利用いただけます。</span>
        </div>
      )}

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
                disabled={loading === plan.id || currentPlan === plan.id || isCancelling}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${btnColor[plan.color]} ${currentPlan === plan.id ? 'opacity-50 cursor-default' : ''}`}>
                {loading === plan.id ? '処理中...' : currentPlan === plan.id ? (isCancelling ? '解約予定' : '現在のプラン') : 'このプランにする'}
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

      {/* 解約セクション */}
      {isPaid && !isCancelling && (
        <div className="border border-[#1a1a2e] rounded-2xl p-6">
          <h2 className="font-display text-base font-bold mb-1">解約・プラン変更</h2>
          <p className="text-xs text-[#6b6b8a] mb-4">解約は更新日の20日前までに申請してください。申請後も有効期限まで全機能をご利用いただけます。</p>
          <button onClick={() => setShowCancelModal(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold border border-[rgba(255,69,96,0.3)] text-[#ff4560] hover:bg-[rgba(255,69,96,0.08)] transition-all">
            サービスを解約する
          </button>
        </div>
      )}

      {/* 解約確認モーダル */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#0f0f1e] border border-[#1a1a2e] rounded-2xl p-8 max-w-md w-full space-y-5">
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-display text-xl font-extrabold mb-2">解約の確認</h3>
              <p className="text-sm text-[#9898b8] leading-relaxed">
                解約申請を行います。<br />
                更新日まで引き続きご利用いただけますが、<span className="text-[#ff4560] font-medium">更新日以降はすべての機能が停止</span>します。
              </p>
            </div>
            <div className="bg-[#04040a] rounded-xl p-4 space-y-2 text-xs text-[#6b6b8a]">
              <div className="flex items-center gap-2"><span className="text-[#ff4560]">✕</span> AI投稿生成が停止します</div>
              <div className="flex items-center gap-2"><span className="text-[#ff4560]">✕</span> 分析データが閲覧できなくなります</div>
              <div className="flex items-center gap-2"><span className="text-[#ff4560]">✕</span> 自動いいね・返信が停止します</div>
              <div className="flex items-center gap-2"><span className="text-[#00e5a0]">✓</span> ポイント残高は保持されます</div>
              <div className="flex items-center gap-2"><span className="text-[#00e5a0]">✓</span> 解約申請はいつでも取り消せます</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold border border-[#1a1a2e] text-[#6b6b8a] hover:border-[#252540] transition-all">
                キャンセル
              </button>
              <button onClick={handleCancel} disabled={cancelLoading}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-[rgba(255,69,96,0.12)] border border-[rgba(255,69,96,0.3)] text-[#ff4560] hover:bg-[rgba(255,69,96,0.2)] transition-all disabled:opacity-50">
                {cancelLoading ? '処理中...' : '解約を申請する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


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
