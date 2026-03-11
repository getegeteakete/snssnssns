'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

type Tab = 'posts' | 'likes' | 'triggers' | 'ai_reply'

const PLATFORMS = ['twitter', 'instagram', 'facebook']
const PLATFORM_LABELS: Record<string, string> = { twitter: '𝕏 X', instagram: 'Instagram', facebook: 'Facebook' }

export default function SnsPage() {
  const [tab, setTab] = useState<Tab>('posts')
  const [generating, setGenerating] = useState(false)
  const [postForm, setPostForm] = useState({ platform: 'instagram', topic: '', tone: 'friendly', businessType: '' })
  const [generatedPost, setGeneratedPost] = useState<any>(null)
  const [triggers, setTriggers] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [replyQueue, setReplyQueue] = useState<any[]>([])
  const [triggerForm, setTriggerForm] = useState({ platform: 'instagram', trigger_type: 'comment', keywords: '', reply_template: '', url_type: 'product_lp', destination_url: '' })
  const [jobForm, setJobForm] = useState({ platform: 'instagram', job_type: 'like', target_type: 'hashtag', target_value: '', daily_limit: 100 })

  useEffect(() => {
    fetchTriggers(); fetchJobs(); fetchReplyQueue()
  }, [])

  async function fetchTriggers() {
    const r = await fetch('/api/sns/triggers')
    if (r.ok) setTriggers(await r.json())
  }
  async function fetchJobs() {
    const r = await fetch('/api/sns/jobs')
    if (r.ok) setJobs(await r.json())
  }
  async function fetchReplyQueue() {
    const r = await fetch('/api/sns/webhook?status=pending')
    if (r.ok) setReplyQueue(await r.json())
  }

  async function generatePost() {
    if (!postForm.topic) { toast.error('トピックを入力してください'); return }
    setGenerating(true)
    const r = await fetch('/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate_post', params: { ...postForm, targetAudience: '30代女性' } }) })
    const data = await r.json()
    if (r.ok) { setGeneratedPost(data.result); toast.success(`生成完了 (${data.points_used}pt使用)`) }
    else toast.error(data.error)
    setGenerating(false)
  }

  async function saveTrigger() {
    const r = await fetch('/api/sns/triggers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(triggerForm) })
    const data = await r.json()
    if (r.ok) { toast.success('トリガーを作成しました'); fetchTriggers(); setTriggerForm({ platform: 'instagram', trigger_type: 'comment', keywords: '', reply_template: '', url_type: 'product_lp', destination_url: '' }) }
    else toast.error(data.error)
  }

  async function toggleTrigger(id: string, is_active: boolean) {
    await fetch('/api/sns/triggers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active }) })
    fetchTriggers()
  }

  async function saveJob() {
    const r = await fetch('/api/sns/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(jobForm) })
    const data = await r.json()
    if (r.ok) { toast.success('ジョブを作成しました'); fetchJobs() }
    else toast.error(data.error)
  }

  async function approveReply(id: string) {
    // PATCH reply queue status
    const r = await fetch('/api/sns/webhook', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'approved' }) })
    if (r.ok) { toast.success('返答を承認しました'); fetchReplyQueue() }
  }

  const tabs: { id: Tab; label: string; color: string }[] = [
    { id: 'posts',    label: '投稿生成',          color: 'cyan' },
    { id: 'likes',    label: '自動いいね・フォロー', color: 'green' },
    { id: 'triggers', label: 'キーワード返信',      color: 'amber' },
    { id: 'ai_reply', label: 'AI自動返答',         color: 'purple' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tighter">SNS自動化</h1>
        <p className="text-sm text-[#6b6b8a] mt-1">投稿・いいね・キーワード返信・AI返答を一元管理</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border
              ${tab === t.id
                ? t.color === 'cyan'   ? 'bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border-[rgba(0,212,255,0.3)]'
                : t.color === 'green'  ? 'bg-[rgba(0,229,160,0.12)] text-[#00e5a0] border-[rgba(0,229,160,0.3)]'
                : t.color === 'amber'  ? 'bg-[rgba(255,184,0,0.12)] text-[#ffb800] border-[rgba(255,184,0,0.3)]'
                :                        'bg-[rgba(139,92,246,0.12)] text-[#8b5cf6] border-[rgba(139,92,246,0.3)]'
                : 'bg-transparent text-[#6b6b8a] border-[#1a1a2e] hover:border-[#252540]'
              }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── POSTS TAB ── */}
      {tab === 'posts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h2 className="font-display text-base font-bold">AI投稿生成</h2>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">媒体</label>
              <select value={postForm.platform} onChange={e => setPostForm(p => ({ ...p, platform: e.target.value }))} className="input-field">
                {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">業種・ビジネス内容</label>
              <input type="text" value={postForm.businessType} onChange={e => setPostForm(p => ({ ...p, businessType: e.target.value }))} placeholder="例: エステサロン" className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">投稿トピック</label>
              <textarea value={postForm.topic} onChange={e => setPostForm(p => ({ ...p, topic: e.target.value }))} placeholder="例: 春の新メニュー キャンペーン告知" rows={3} className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">トーン</label>
              <select value={postForm.tone} onChange={e => setPostForm(p => ({ ...p, tone: e.target.value }))} className="input-field">
                <option value="friendly">フレンドリー</option>
                <option value="professional">プロフェッショナル</option>
                <option value="casual">カジュアル</option>
                <option value="urgent">緊急・期間限定</option>
              </select>
            </div>
            <button onClick={generatePost} disabled={generating} className="w-full btn-cyan justify-center py-3 disabled:opacity-50">
              {generating ? '生成中...' : '✦ AI投稿文を生成 (5pt)'}
            </button>
          </div>

          {generatedPost && (
            <div className="card space-y-4">
              <h2 className="font-display text-base font-bold text-[#00d4ff]">生成結果</h2>
              <div className="bg-[#0f0f1e] border border-[rgba(0,212,255,0.15)] rounded-xl p-4">
                <p className="text-sm text-[#c8c8e0] leading-relaxed whitespace-pre-wrap">{generatedPost.content}</p>
              </div>
              {generatedPost.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {generatedPost.hashtags.map((h: string) => (
                    <span key={h} className="badge-cyan">{h}</span>
                  ))}
                </div>
              )}
              {generatedPost.best_time && (
                <div className="text-xs text-[#6b6b8a]">🕒 最適投稿時間: <span className="text-[#ffb800]">{generatedPost.best_time}</span></div>
              )}
              {generatedPost.platform_tip && (
                <div className="text-xs text-[#6b6b8a] bg-[#0f0f1e] rounded-lg p-3">💡 {generatedPost.platform_tip}</div>
              )}
              <div className="flex gap-2">
                <button className="flex-1 btn-primary py-2.5 text-xs justify-center">今すぐ投稿</button>
                <button className="flex-1 btn-ghost py-2.5 text-xs justify-center">予約投稿</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LIKES TAB ── */}
      {tab === 'likes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h2 className="font-display text-base font-bold">自動いいね・フォロー設定</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6b6b8a] mb-1.5">媒体</label>
                <select value={jobForm.platform} onChange={e => setJobForm(j => ({ ...j, platform: e.target.value }))} className="input-field">
                  <option value="instagram">Instagram</option>
                  <option value="twitter">X (Twitter)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6b6b8a] mb-1.5">アクション</label>
                <select value={jobForm.job_type} onChange={e => setJobForm(j => ({ ...j, job_type: e.target.value }))} className="input-field">
                  <option value="like">いいね</option>
                  <option value="follow">フォロー</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">ターゲット種別</label>
              <select value={jobForm.target_type} onChange={e => setJobForm(j => ({ ...j, target_type: e.target.value }))} className="input-field">
                <option value="hashtag">ハッシュタグ</option>
                <option value="keyword">キーワード</option>
                <option value="competitor_followers">競合フォロワー</option>
                <option value="location">場所</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">
                {jobForm.target_type === 'hashtag' ? 'ハッシュタグ（#なし）' : jobForm.target_type === 'keyword' ? 'キーワード' : jobForm.target_type === 'competitor_followers' ? '競合アカウントID' : '場所名'}
              </label>
              <input type="text" value={jobForm.target_value} onChange={e => setJobForm(j => ({ ...j, target_value: e.target.value }))} placeholder={jobForm.target_type === 'hashtag' ? 'エステ 美容 渋谷' : '例: @competitor_account'} className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">1日の上限 (最大300)</label>
              <div className="flex items-center gap-3">
                <input type="range" min={10} max={300} step={10} value={jobForm.daily_limit}
                  onChange={e => setJobForm(j => ({ ...j, daily_limit: Number(e.target.value) }))}
                  className="flex-1 accent-[#00e5a0]" />
                <span className="text-[#00e5a0] font-bold text-sm w-12 text-right">{jobForm.daily_limit}</span>
              </div>
              <p className="text-[10px] text-[#6b6b8a] mt-1">凍結リスク低: ~100 / 中: ~200 / 上限: 300</p>
            </div>
            <button onClick={saveJob} className="w-full btn-primary justify-center py-3" style={{ background: 'var(--green, #00e5a0)', color: '#04040a' }}>
              ジョブを開始
            </button>
          </div>

          <div className="card">
            <h2 className="font-display text-base font-bold mb-4">稼働中のジョブ</h2>
            {jobs.length === 0 ? (
              <p className="text-sm text-[#6b6b8a] text-center py-8">ジョブがありません</p>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${job.is_active ? 'bg-[#00e5a0] animate-pulse-dot' : 'bg-[#6b6b8a]'}`}/>
                        <span className="text-xs font-bold text-[#e8e8f4]">{PLATFORM_LABELS[job.platform] || job.platform}</span>
                        <span className="badge badge-green">{job.job_type === 'like' ? 'いいね' : 'フォロー'}</span>
                      </div>
                      <button onClick={() => fetch('/api/sns/jobs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: job.id, is_active: !job.is_active }) }).then(() => fetchJobs())}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${job.is_active ? 'border-[#ff4560] text-[#ff4560] hover:bg-[rgba(255,69,96,0.1)]' : 'border-[#00e5a0] text-[#00e5a0] hover:bg-[rgba(0,229,160,0.1)]'}`}>
                        {job.is_active ? '停止' : '再開'}
                      </button>
                    </div>
                    <p className="text-xs text-[#6b6b8a]">{job.target_type}: <span className="text-[#e8e8f4]">{job.target_value}</span></p>
                    <div className="flex gap-4 mt-2 text-[10px] text-[#6b6b8a]">
                      <span>今日: <span className="text-[#00e5a0]">{job.executed_today}</span>/{job.daily_limit}</span>
                      <span>累計: {job.total_executed}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TRIGGERS TAB ── */}
      {tab === 'triggers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h2 className="font-display text-base font-bold">キーワードトリガー作成</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6b6b8a] mb-1.5">媒体</label>
                <select value={triggerForm.platform} onChange={e => setTriggerForm(t => ({ ...t, platform: e.target.value }))} className="input-field">
                  <option value="instagram">Instagram</option>
                  <option value="twitter">X (Twitter)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6b6b8a] mb-1.5">トリガー種別</label>
                <select value={triggerForm.trigger_type} onChange={e => setTriggerForm(t => ({ ...t, trigger_type: e.target.value }))} className="input-field">
                  <option value="comment">コメント</option>
                  <option value="dm">DM</option>
                  <option value="mention">メンション</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">トリガーキーワード（カンマ区切り）</label>
              <input type="text" value={triggerForm.keywords} onChange={e => setTriggerForm(t => ({ ...t, keywords: e.target.value }))} placeholder="欲しい, 詳細, プレゼント, 送って" className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">返信テンプレート <span className="text-[#ffb800]">&#123;URL&#125;</span> でURL挿入</label>
              <textarea value={triggerForm.reply_template} onChange={e => setTriggerForm(t => ({ ...t, reply_template: e.target.value }))} rows={3} placeholder="ご連絡ありがとうございます！こちらの専用URLからどうぞ🎁&#10;{URL}" className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">URLタイプ</label>
              <select value={triggerForm.url_type} onChange={e => setTriggerForm(t => ({ ...t, url_type: e.target.value }))} className="input-field">
                <option value="product_lp">商品LP</option>
                <option value="gift_download">プレゼントDL</option>
                <option value="reservation">予約フォーム</option>
                <option value="custom">カスタムURL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">送り先URL</label>
              <input type="url" value={triggerForm.destination_url} onChange={e => setTriggerForm(t => ({ ...t, destination_url: e.target.value }))} placeholder="https://example.com/product" className="input-field" />
            </div>
            <button onClick={saveTrigger} className="w-full btn-primary justify-center py-3">
              トリガーを作成
            </button>
          </div>

          <div className="card">
            <h2 className="font-display text-base font-bold mb-4">設定済みトリガー</h2>
            {triggers.length === 0 ? (
              <p className="text-sm text-[#6b6b8a] text-center py-8">トリガーがありません</p>
            ) : (
              <div className="space-y-3">
                {triggers.map(t => (
                  <div key={t.id} className="bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-2 flex-wrap">
                        {(t.keywords as string[]).map((kw: string) => (
                          <span key={kw} className="badge-amber">{kw}</span>
                        ))}
                      </div>
                      <button onClick={() => toggleTrigger(t.id, !t.is_active)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${t.is_active ? 'bg-[#00e5a0]' : 'bg-[#252540]'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${t.is_active ? 'left-5' : 'left-0.5'}`}/>
                      </button>
                    </div>
                    <p className="text-xs text-[#9898b8] truncate">{t.reply_template}</p>
                    <div className="flex gap-3 mt-2 text-[10px] text-[#6b6b8a]">
                      <span>{t.platform} / {t.trigger_type}</span>
                      <span>発動: <span className="text-[#ffb800]">{t.triggered_count}回</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI REPLY TAB ── */}
      {tab === 'ai_reply' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h2 className="font-display text-base font-bold">AI自動返答設定</h2>
            <div className="space-y-3">
              {['auto', 'approval', 'hybrid'].map(mode => (
                <label key={mode} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all
                  ${mode === 'auto' ? 'border-[rgba(0,229,160,0.2)] bg-[rgba(0,229,160,0.04)]' : mode === 'approval' ? 'border-[rgba(255,184,0,0.2)] bg-[rgba(255,184,0,0.04)]' : 'border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.04)]'}`}>
                  <input type="radio" name="mode" value={mode} className="mt-0.5" defaultChecked={mode === 'approval'} />
                  <div>
                    <div className={`text-sm font-bold ${mode === 'auto' ? 'text-[#00e5a0]' : mode === 'approval' ? 'text-[#ffb800]' : 'text-[#8b5cf6]'}`}>
                      {mode === 'auto' ? '完全自動モード' : mode === 'approval' ? '承認モード（推奨）' : 'ハイブリッドモード'}
                    </div>
                    <div className="text-xs text-[#6b6b8a] mt-1">
                      {mode === 'auto' ? 'AIが即座に返答を送信。24時間無人対応。' : mode === 'approval' ? 'AI返答案をLINEに送付→承認後に送信。安全重視。' : '一般質問は自動、クレーム・価格交渉は承認待ちに自動振り分け。'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">ブランドトーン・キャラクター</label>
              <textarea rows={3} defaultValue="丁寧でフレンドリーな美容サロンのスタッフとして返答してください。絵文字を適度に使い、温かみのある言葉を使ってください。" className="input-field resize-none" />
            </div>
            <button className="w-full btn-primary justify-center py-3">設定を保存・有効化</button>
          </div>

          <div className="card">
            <h2 className="font-display text-base font-bold mb-4">承認待ちの返答 <span className="text-[#8b5cf6]">{replyQueue.length}件</span></h2>
            {replyQueue.length === 0 ? (
              <p className="text-sm text-[#6b6b8a] text-center py-8">承認待ちの返答はありません</p>
            ) : (
              <div className="space-y-4">
                {replyQueue.map(item => (
                  <div key={item.id} className="bg-[#0f0f1e] border border-[rgba(139,92,246,0.2)] rounded-xl p-4">
                    <div className="text-xs text-[#6b6b8a] mb-2">{item.sender_name} · {item.platform}</div>
                    <div className="bg-[rgba(255,255,255,0.04)] rounded-lg p-3 mb-2 text-xs text-[#c8c8e0]">{item.original_text}</div>
                    <div className="bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.15)] rounded-lg p-3 mb-3 text-xs text-[#c8c8e0]">
                      <div className="text-[10px] text-[#8b5cf6] mb-1">AI返答案</div>
                      {item.ai_reply}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveReply(item.id)} className="flex-1 bg-[#8b5cf6] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#7c3aed] transition-colors">承認して送信</button>
                      <button className="px-3 bg-transparent border border-[#252540] text-[#6b6b8a] text-xs py-2 rounded-lg hover:border-[#ff4560] hover:text-[#ff4560] transition-colors">修正</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
