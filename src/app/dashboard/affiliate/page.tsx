'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function AffiliatePage() {
  const [data, setData] = useState<any>(null)
  const [tab, setTab] = useState<'aimo' | 'ec'>('aimo')
  const [ecForm, setEcForm] = useState({ name: '', description: '', product_url: '', commission_type: 'percentage', commission_value: 10, cookie_days: 30 })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const r = await fetch('/api/affiliate')
    if (r.ok) setData(await r.json())
  }

  async function copyAffiliateUrl() {
    if (!data?.affiliate_url) return
    await navigator.clipboard.writeText(data.affiliate_url)
    toast.success('URLをコピーしました')
  }

  async function createEcProgram() {
    setCreating(true)
    const r = await fetch('/api/affiliate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_ec_program', ...ecForm }) })
    const res = await r.json()
    if (r.ok) { toast.success('ECアフィリエイトプログラムを作成しました'); fetchData() }
    else toast.error(res.error)
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tighter">アフィリエイト</h1>
        <p className="text-sm text-[#6b6b8a] mt-1">AIMOを紹介して稼ぐ / 自社ECのアフィリエイタープログラムを管理</p>
      </div>

      <div className="flex gap-2">
        {[{ id: 'aimo', label: 'AIMOを紹介して稼ぐ' }, { id: 'ec', label: '自社ECアフィリエイト管理' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${tab === t.id ? 'bg-[rgba(255,184,0,0.12)] text-[#ffb800] border-[rgba(255,184,0,0.3)]' : 'text-[#6b6b8a] border-[#1a1a2e] hover:border-[#252540]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'aimo' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '累計報酬', value: `¥${(data?.total_earned || 0).toLocaleString()}`, color: 'text-[#ffb800]' },
              { label: '支払い待ち', value: `¥${(data?.pending_reward || 0).toLocaleString()}`, color: 'text-[#00e5a0]' },
              { label: '紹介件数', value: `${data?.conversions?.length || 0}件`, color: 'text-[#00d4ff]' },
            ].map(s => (
              <div key={s.label} className="card-hover text-center">
                <div className={`font-display text-3xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-[#6b6b8a] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Affiliate URL */}
          <div className="card">
            <h2 className="font-display text-base font-bold mb-4">あなたの紹介URL</h2>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#0f0f1e] border border-[rgba(0,212,255,0.2)] rounded-xl px-4 py-3 text-sm text-[#00d4ff] font-mono truncate">
                {data?.affiliate_url || 'ロード中...'}
              </div>
              <button onClick={copyAffiliateUrl} className="btn-cyan py-3 px-5 text-sm">コピー</button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { label: '無料登録で', value: '¥500/人', color: 'text-[#00d4ff]' },
                { label: '初月成約で', value: '20%', color: 'text-[#ffb800]' },
                { label: '継続課金で', value: '5%/月', color: 'text-[#00e5a0]' },
              ].map(r => (
                <div key={r.label} className="bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl p-3">
                  <div className={`font-display text-xl font-extrabold ${r.color}`}>{r.value}</div>
                  <div className="text-[10px] text-[#6b6b8a] mt-0.5">{r.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversions */}
          {data?.conversions?.length > 0 && (
            <div className="card">
              <h2 className="font-display text-base font-bold mb-4">紹介履歴</h2>
              <div className="space-y-2">
                {data.conversions.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-[#1a1a2e] last:border-0">
                    <div>
                      <div className="text-sm text-[#e8e8f4]">{c.conversion_type === 'signup' ? '無料登録' : c.conversion_type === 'paid_first' ? '有料転換' : '継続課金'}</div>
                      <div className="text-xs text-[#6b6b8a]">{new Date(c.created_at).toLocaleDateString('ja-JP')}</div>
                    </div>
                    <div>
                      <div className="font-display text-base font-bold text-[#00e5a0]">+¥{c.reward.toLocaleString()}</div>
                      <div className={`text-[10px] text-right ${c.status === 'paid' ? 'text-[#00e5a0]' : 'text-[#6b6b8a]'}`}>{c.status === 'paid' ? '支払済' : '確定待ち'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'ec' && (
        <div className="space-y-6">
          {!data?.can_use_ec_affiliate ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="font-display text-lg font-bold mb-2">Businessプラン以上が必要です</h3>
              <p className="text-sm text-[#6b6b8a] mb-4">自社ECのアフィリエイタープログラム管理はBusinessプラン以上でご利用いただけます</p>
              <a href="/dashboard/billing" className="btn-primary text-sm py-2.5 px-6">プランをアップグレード</a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create program */}
              <div className="card space-y-4">
                <h2 className="font-display text-base font-bold">ECプログラム作成</h2>
                <div>
                  <label className="block text-xs text-[#6b6b8a] mb-1.5">プログラム名</label>
                  <input type="text" value={ecForm.name} onChange={e => setEcForm(f => ({ ...f, name: e.target.value }))} placeholder="例: 〇〇オンラインショップ" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-[#6b6b8a] mb-1.5">商品・LP URL</label>
                  <input type="url" value={ecForm.product_url} onChange={e => setEcForm(f => ({ ...f, product_url: e.target.value }))} placeholder="https://shop.example.com" className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#6b6b8a] mb-1.5">報酬タイプ</label>
                    <select value={ecForm.commission_type} onChange={e => setEcForm(f => ({ ...f, commission_type: e.target.value }))} className="input-field">
                      <option value="percentage">成約額の〇%</option>
                      <option value="fixed">固定金額</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b6b8a] mb-1.5">{ecForm.commission_type === 'percentage' ? '報酬率 (%)' : '固定報酬 (¥)'}</label>
                    <input type="number" value={ecForm.commission_value} onChange={e => setEcForm(f => ({ ...f, commission_value: Number(e.target.value) }))} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#6b6b8a] mb-1.5">Cookie有効期間（日）</label>
                  <input type="number" value={ecForm.cookie_days} onChange={e => setEcForm(f => ({ ...f, cookie_days: Number(e.target.value) }))} className="input-field" />
                </div>
                <button onClick={createEcProgram} disabled={creating} className="w-full btn-primary justify-center py-3 disabled:opacity-50">
                  {creating ? '作成中...' : 'プログラムを作成'}
                </button>
              </div>

              {/* Programs list */}
              <div className="card">
                <h2 className="font-display text-base font-bold mb-4">作成済みプログラム</h2>
                {(data?.ec_programs || []).length === 0 ? (
                  <p className="text-sm text-[#6b6b8a] text-center py-8">プログラムがありません</p>
                ) : (
                  <div className="space-y-3">
                    {data.ec_programs.map((p: any) => (
                      <div key={p.id} className="bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl p-4">
                        <div className="font-medium text-sm text-[#e8e8f4] mb-1">{p.name}</div>
                        <div className="text-xs text-[#6b6b8a]">報酬: {p.commission_type === 'percentage' ? `${p.commission_value}%` : `¥${p.commission_value}`} / Cookie: {p.cookie_days}日</div>
                        <div className="text-xs text-[#00d4ff] mt-1 font-mono truncate">{`${process.env.NEXT_PUBLIC_APP_URL}/api/affiliate/track?tag={TAG}`}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
