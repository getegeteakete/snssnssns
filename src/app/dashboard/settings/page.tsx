'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

const ERROR_MESSAGES: Record<string, string> = {
  twitter_not_configured: 'X(Twitter)APIキー未設定。Vercelに TWITTER_CLIENT_ID を設定してください。',
  instagram_not_configured: 'InstagramのAPIキー未設定。Vercelに META_APP_ID を設定してください。',
  facebook_not_configured: 'FacebookのAPIキー未設定。Vercelに META_APP_ID を設定してください。',
  gmb_not_configured: 'Google Business ProfileのAPIキー未設定。Vercelに GOOGLE_CLIENT_ID を設定してください。',
  oauth_denied: '連携がキャンセルされました。',
  oauth_failed: '連携に失敗しました。もう一度お試しください。',
}
const PLATFORM_LABELS: Record<string, string> = {
  twitter: 'X(Twitter)', instagram: 'Instagram', facebook: 'Facebook', gmb: 'Google Business Profile',
}

function SettingsInner() {
  const [profile, setProfile] = useState<any>(null)
  const [snsAccounts, setSnsAccounts] = useState<any[]>([])
  const [tab, setTab] = useState<'profile' | 'sns' | 'line' | 'ai'>('profile')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', business_type: '', brand_tone: '' })
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchSettings()
    const error = searchParams.get('error')
    const success = searchParams.get('success')
    const platform = searchParams.get('platform')
    if (error) toast.error(ERROR_MESSAGES[error] || 'エラーが発生しました', { duration: 6000 })
    if (success === 'connected' && platform) toast.success(`${PLATFORM_LABELS[platform] || platform}の連携が完了しました！`)
  }, [])

  async function fetchSettings() {
    const [r1, r2] = await Promise.all([
      fetch('/api/settings/profile'),
      fetch('/api/settings/sns-accounts'),
    ])
    if (r1.ok) { const d = await r1.json(); setProfile(d); setForm({ full_name: d.full_name || '', business_type: d.business_type || '', brand_tone: d.brand_tone || '' }) }
    if (r2.ok) setSnsAccounts(await r2.json())
  }

  async function saveProfile() {
    setSaving(true)
    const r = await fetch('/api/settings/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (r.ok) toast.success('保存しました')
    else toast.error('保存に失敗しました')
    setSaving(false)
  }

  function connectOAuth(platform: string) {
    window.location.href = `/api/auth/${platform}`
  }

  const PLATFORM_INFO: Record<string, { label: string; color: string; icon: string }> = {
    twitter:    { label: 'X (Twitter)', color: 'text-[#e8e8f4]', icon: '𝕏' },
    instagram:  { label: 'Instagram', color: 'text-[#e1306c]', icon: 'IG' },
    facebook:   { label: 'Facebook', color: 'text-[#1877f2]', icon: 'FB' },
    gmb:        { label: 'Google Business Profile', color: 'text-[#4285f4]', icon: 'G' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tighter">設定</h1>
        <p className="text-sm text-[#6b6b8a] mt-1">アカウント・SNS連携・AI設定を管理</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[{ id: 'profile', label: 'プロフィール' }, { id: 'sns', label: 'SNS連携' }, { id: 'line', label: 'LINE連携' }, { id: 'ai', label: 'AI設定' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${tab === t.id ? 'bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border-[rgba(0,212,255,0.3)]' : 'text-[#6b6b8a] border-[#1a1a2e]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="card max-w-lg space-y-4">
          <h2 className="font-display text-base font-bold">基本情報</h2>
          <div>
            <label className="block text-xs text-[#6b6b8a] mb-1.5">お名前・会社名</label>
            <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-[#6b6b8a] mb-1.5">業種・ビジネス内容</label>
            <input type="text" value={form.business_type} onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))} placeholder="例: 渋谷のエステサロン" className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-[#6b6b8a] mb-1.5">メールアドレス</label>
            <input type="email" value={profile?.email || ''} disabled className="input-field opacity-50" />
          </div>
          <button onClick={saveProfile} disabled={saving} className="btn-primary py-3 px-8 disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      )}

      {/* SNS tab */}
      {tab === 'sns' && (
        <div className="card max-w-lg">
          <h2 className="font-display text-base font-bold mb-4">SNSアカウント連携</h2>
          <div className="space-y-3">
            {Object.entries(PLATFORM_INFO).map(([platform, info]) => {
              const connected = snsAccounts.find(a => a.platform === platform)
              return (
                <div key={platform} className="flex items-center justify-between p-4 bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#1a1a2e] flex items-center justify-center text-sm font-bold">{info.icon}</div>
                    <div>
                      <div className="text-sm font-medium text-[#e8e8f4]">{info.label}</div>
                      {connected ? (
                        <div className="text-xs text-[#00e5a0]">✓ {connected.account_name || '接続済み'}</div>
                      ) : (
                        <div className="text-xs text-[#6b6b8a]">未接続</div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => connectOAuth(platform)}
                    className={`text-xs px-4 py-2 rounded-full border transition-colors ${connected ? 'border-[#ff4560] text-[#ff4560] hover:bg-[rgba(255,69,96,0.08)]' : 'border-[#00d4ff] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.08)]'}`}>
                    {connected ? '再接続' : '連携する'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LINE tab */}
      {tab === 'line' && (
        <div className="card max-w-lg">
          <h2 className="font-display text-base font-bold mb-2">LINE承認フロー設定</h2>
          <p className="text-xs text-[#6b6b8a] mb-6">AIMOからの提案・警告・レポートをLINEで受け取り、承認・却下ができます</p>

          <div className="space-y-4">
            <div className="bg-[rgba(6,199,85,0.05)] border border-[rgba(6,199,85,0.2)] rounded-xl p-4">
              <div className="text-sm font-bold text-[#06c755] mb-2">連携手順</div>
              <ol className="text-xs text-[#9898b8] space-y-2 list-decimal pl-4">
                <li>LINE公式アカウントで「AIMO」を友だち追加</li>
                <li>下のボタンからLINEログインで認証</li>
                <li>通知設定を有効化</li>
              </ol>
            </div>

            {profile?.line_user_id ? (
              <div className="flex items-center gap-3 p-4 bg-[rgba(6,199,85,0.05)] border border-[rgba(6,199,85,0.2)] rounded-xl">
                <div className="w-8 h-8 rounded-full bg-[#06c755] flex items-center justify-center text-white text-sm">✓</div>
                <div>
                  <div className="text-sm font-bold text-[#00e5a0]">LINE連携済み</div>
                  <div className="text-xs text-[#6b6b8a]">通知が届きます</div>
                </div>
              </div>
            ) : (
              <button className="w-full flex items-center justify-center gap-2 bg-[#06c755] text-white font-bold py-3 rounded-xl hover:bg-[#05a847] transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2C5.58 2 2 5.13 2 9c0 2.4 1.27 4.53 3.24 5.89L4.5 18l3.38-1.69c.67.18 1.38.28 2.12.28 4.42 0 8-3.13 8-7S14.42 2 10 2z"/></svg>
                LINEで連携する
              </button>
            )}

            <div>
              <div className="text-sm font-medium text-[#e8e8f4] mb-3">通知設定</div>
              {[
                { label: '改善提案の通知', key: 'notify_proposals', default: true },
                { label: '警告アラートの通知', key: 'notify_warnings', default: true },
                { label: '日次レポート (毎朝8時)', key: 'notify_daily', default: true },
                { label: '週次レポート (月曜朝)', key: 'notify_weekly', default: false },
              ].map(n => (
                <label key={n.key} className="flex items-center justify-between py-3 border-b border-[#1a1a2e] cursor-pointer">
                  <span className="text-sm text-[#9898b8]">{n.label}</span>
                  <input type="checkbox" defaultChecked={n.default} className="w-4 h-4 accent-[#00d4ff]" />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI settings */}
      {tab === 'ai' && (
        <div className="card max-w-lg space-y-4">
          <h2 className="font-display text-base font-bold">AIエージェント設定</h2>
          <div>
            <label className="block text-xs text-[#6b6b8a] mb-1.5">ブランドトーン（AIへの指示）</label>
            <textarea value={form.brand_tone} onChange={e => setForm(f => ({ ...f, brand_tone: e.target.value }))} rows={4}
              placeholder="例: 30代女性をターゲットにした美容サロンです。丁寧でフレンドリーなトーンで、専門知識を平易な言葉で伝えてください。絵文字を適度に使ってください。"
              className="input-field resize-none" />
            <p className="text-[10px] text-[#6b6b8a] mt-1.5">このトーンがすべてのAI生成コンテンツに反映されます</p>
          </div>
          <div>
            <label className="block text-xs text-[#6b6b8a] mb-2">自動承認レベル</label>
            <div className="space-y-2">
              {[
                { id: 'strict', label: '厳格（すべてLINEで承認）', desc: '投稿・変更すべてに承認が必要' },
                { id: 'normal', label: '標準（定型のみ自動）', desc: '定型SNS投稿は自動。LP変更・広告は承認' },
                { id: 'auto',   label: '自動（軽微な変更は自動）', desc: 'リスクの低い変更のみ自動実行' },
              ].map(o => (
                <label key={o.id} className="flex items-start gap-3 p-3 rounded-xl border border-[#1a1a2e] cursor-pointer hover:border-[#252540]">
                  <input type="radio" name="auto_level" value={o.id} defaultChecked={o.id === 'normal'} className="mt-0.5 accent-[#00d4ff]" />
                  <div>
                    <div className="text-sm font-medium text-[#e8e8f4]">{o.label}</div>
                    <div className="text-xs text-[#6b6b8a]">{o.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} className="btn-primary py-3 px-8 disabled:opacity-50">
            {saving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      )}
    </div>
  )
}
-e 
export default function SettingsPage() {
  return <Suspense fallback={<div className="p-6 text-[#6b6b8a]">読み込み中...</div>}><SettingsInner /></Suspense>
}
