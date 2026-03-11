'use client'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

type Tab = 'posts' | 'likes' | 'triggers' | 'ai_reply'
const PLATFORM_LABELS: Record<string, string> = { twitter: '𝕏 X', instagram: 'Instagram', facebook: 'Facebook' }

export default function SnsPage() {
  const [tab, setTab] = useState<Tab>('posts')
  const [generating, setGenerating] = useState(false)
  const [postForm, setPostForm] = useState({ platform: 'instagram', topic: '', tone: 'friendly', businessType: '' })
  const [generatedPost, setGeneratedPost] = useState<any>(null)
  const [images, setImages] = useState<{ url: string; preview: string; name: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [triggers, setTriggers] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [replyQueue, setReplyQueue] = useState<any[]>([])
  const [triggerForm, setTriggerForm] = useState({ platform: 'instagram', trigger_type: 'comment', keywords: '', reply_template: '', url_type: 'product_lp', destination_url: '' })
  const [jobForm, setJobForm] = useState({ platform: 'instagram', job_type: 'like', target_type: 'hashtag', target_value: '', daily_limit: 100 })

  useEffect(() => { fetchTriggers(); fetchJobs(); fetchReplyQueue() }, [])

  async function fetchTriggers() { const r = await fetch('/api/sns/triggers'); if (r.ok) setTriggers(await r.json()) }
  async function fetchJobs() { const r = await fetch('/api/sns/jobs'); if (r.ok) setJobs(await r.json()) }
  async function fetchReplyQueue() { const r = await fetch('/api/sns/webhook?status=pending'); if (r.ok) setReplyQueue(await r.json()) }

  // ── 画像アップロード ───────────────────────────────────
  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 4) { toast.error('画像は最大4枚まで'); return }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} は5MB超です`); continue }
      const preview = URL.createObjectURL(file)

      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const r = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await r.json()
        if (r.ok) {
          setImages(prev => [...prev, { url: data.url, preview, name: file.name }])
          toast.success('画像をアップロードしました')
        } else {
          toast.error(data.error || 'アップロード失敗')
          // プレビューだけ追加（URL未取得）
          setImages(prev => [...prev, { url: preview, preview, name: file.name }])
        }
      } catch {
        // オフライン用フォールバック：プレビューURLをそのまま使用
        setImages(prev => [...prev, { url: preview, preview, name: file.name }])
        toast('プレビュー表示中（投稿時にアップロード）', { icon: '📷' })
      }
      setUploading(false)
    }
    e.target.value = ''
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  // ── AI生成 ───────────────────────────────────────────
  async function generatePost() {
    if (!postForm.topic) { toast.error('トピックを入力してください'); return }
    setGenerating(true)
    setGeneratedPost(null)
    try {
      const r = await fetch('/api/agents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_post', params: { ...postForm, targetAudience: '30代女性', hasImages: images.length > 0 } })
      })
      const data = await r.json()
      if (r.ok) { setGeneratedPost(data.result); toast.success(`✅ 生成完了 (${data.points_used}pt)`) }
      else toast.error(data.error || 'エラーが発生しました')
    } catch { toast.error('通信エラーが発生しました') }
    setGenerating(false)
  }

  async function saveJob() {
    const r = await fetch('/api/sns/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(jobForm) })
    const data = await r.json()
    if (r.ok) { toast.success('ジョブを作成しました'); fetchJobs() }
    else toast.error(data.error || 'エラーが発生しました')
  }

  async function toggleTrigger(id: string, is_active: boolean) {
    await fetch('/api/sns/triggers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active }) })
    fetchTriggers()
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true); toast.success('コピーしました！')
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { id: 'posts' as Tab, label: '投稿生成', icon: '✦' },
    { id: 'likes' as Tab, label: '自動いいね・フォロー', icon: '♥' },
    { id: 'triggers' as Tab, label: 'キーワード返信', icon: '⚡' },
    { id: 'ai_reply' as Tab, label: 'AI自動返答', icon: '🤖' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tighter">SNS自動化</h1>
        <p className="text-sm text-[#6b6b8a] mt-1">投稿・いいね・キーワード返信・AI返答を一元管理</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5
              ${tab === t.id ? 'bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border-[rgba(0,212,255,0.3)]' : 'bg-transparent text-[#6b6b8a] border-[#1a1a2e] hover:border-[#252540] hover:text-[#e8e8f4]'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── 投稿生成タブ ── */}
      {tab === 'posts' && (
        <div className="space-y-6">
          <div className="card space-y-5">
            <h2 className="font-display text-base font-bold">AI投稿生成</h2>

            {/* 基本設定 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#6b6b8a] mb-1.5">媒体</label>
                <select value={postForm.platform} onChange={e => setPostForm(p => ({ ...p, platform: e.target.value }))} className="input-field">
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
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
              <div>
                <label className="block text-xs text-[#6b6b8a] mb-1.5">業種</label>
                <input type="text" value={postForm.businessType} onChange={e => setPostForm(p => ({ ...p, businessType: e.target.value }))} placeholder="例: エステサロン" className="input-field" />
              </div>
            </div>

            {/* トピック */}
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">投稿トピック <span className="text-[#ff4560]">*</span></label>
              <textarea value={postForm.topic} onChange={e => setPostForm(p => ({ ...p, topic: e.target.value }))} placeholder="例: 春の新メニューキャンペーン、料金20%OFF、3月末まで" rows={3} className="input-field resize-none" />
            </div>

            {/* ── 画像添付エリア ── */}
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-2">
                添付画像 <span className="text-[#6b6b8a]">（最大4枚 / JPG・PNG・GIF・WEBP / 各5MB以下）</span>
              </label>

              {/* アップロード済み画像プレビュー */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden bg-[#0f0f1e] border border-[#1a1a2e] aspect-square">
                      <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                      {/* 削除ボタン */}
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-[rgba(0,0,0,0.7)] hover:bg-[#ff4560] rounded-full flex items-center justify-center text-white text-xs transition-colors opacity-0 group-hover:opacity-100">
                        ✕
                      </button>
                      {/* 番号バッジ */}
                      <div className="absolute bottom-1.5 left-1.5 w-5 h-5 bg-[rgba(0,212,255,0.8)] rounded-full flex items-center justify-center text-[10px] font-bold text-[#04040a]">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                  {/* 追加ボタン（4枚未満の場合） */}
                  {images.length < 4 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#252540] hover:border-[rgba(0,212,255,0.4)] flex flex-col items-center justify-center gap-1 text-[#6b6b8a] hover:text-[#00d4ff] transition-colors">
                      <span className="text-2xl">+</span>
                      <span className="text-[10px]">追加</span>
                    </button>
                  )}
                </div>
              )}

              {/* ドロップゾーン（画像未選択時） */}
              {images.length === 0 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const dt = e.dataTransfer
                    const input = fileInputRef.current
                    if (input && dt.files.length) {
                      Object.defineProperty(input, 'files', { value: dt.files, writable: true })
                      handleImageSelect({ target: input } as any)
                    }
                  }}
                  className="border-2 border-dashed border-[#1a1a2e] hover:border-[rgba(0,212,255,0.4)] rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(0,212,255,0.03)]">
                  <div className="w-12 h-12 rounded-xl bg-[#0f0f1e] border border-[#1a1a2e] group-hover:border-[rgba(0,212,255,0.3)] flex items-center justify-center text-2xl transition-colors">
                    🖼️
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-[#e8e8f4] group-hover:text-[#00d4ff] transition-colors">
                      {uploading ? 'アップロード中...' : 'クリックまたはドラッグ&ドロップ'}
                    </div>
                    <div className="text-xs text-[#6b6b8a] mt-1">JPG・PNG・GIF・WEBP / 最大5MB / 最大4枚</div>
                  </div>
                  {uploading && (
                    <div className="w-32 h-1 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div className="h-full bg-[#00d4ff] rounded-full animate-pulse" style={{ width: '60%' }}/>
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            {/* 生成ボタン */}
            <button onClick={generatePost} disabled={generating || uploading} className="w-full btn-cyan justify-center py-3 text-sm font-bold disabled:opacity-50 flex items-center gap-2">
              {generating ? (
                <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/><span>AI生成中...</span></>
              ) : (
                <><span>✦</span><span>AI投稿文を生成する</span><span className="text-xs opacity-70 font-normal">(5pt)</span></>
              )}
            </button>
          </div>

          {/* ローディング */}
          {generating && (
            <div className="card border-[rgba(0,212,255,0.2)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 bg-[#00d4ff] rounded-full animate-pulse"/>
                <span className="text-sm text-[#00d4ff]">AIが投稿文を生成しています...</span>
              </div>
              <div className="space-y-2">
                {[100, 80, 90, 60].map((w, i) => (
                  <div key={i} className="h-3 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" style={{ width: `${w}%` }}/>
                ))}
              </div>
            </div>
          )}

          {/* 生成結果 */}
          {generatedPost && !generating && (
            <div className="card border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-[#00d4ff] flex items-center gap-2">✅ 生成完了</h2>
                <span className="text-xs text-[#6b6b8a] bg-[#0f0f1e] px-3 py-1 rounded-full">{PLATFORM_LABELS[postForm.platform]}用</span>
              </div>

              {/* 添付画像サムネイル */}
              {images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {images.map((img, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-[rgba(0,212,255,0.2)]">
                      <img src={img.preview} alt="" className="w-full h-full object-cover"/>
                    </div>
                  ))}
                  <div className="flex items-center text-xs text-[#6b6b8a] pl-1">{images.length}枚添付済み</div>
                </div>
              )}

              {/* 投稿本文 */}
              <div className="relative bg-[#0a0a14] border border-[rgba(0,212,255,0.15)] rounded-xl p-4">
                <p className="text-sm text-[#e8e8f4] leading-relaxed whitespace-pre-wrap pr-10">{generatedPost.content}</p>
                <button onClick={() => copyToClipboard(generatedPost.content)}
                  className="absolute top-3 right-3 p-1.5 text-[#6b6b8a] hover:text-[#00d4ff] bg-[#0f0f1e] rounded-lg border border-[#1a1a2e] hover:border-[rgba(0,212,255,0.3)] transition-colors">
                  {copied ? '✓' : '📋'}
                </button>
              </div>

              {/* ハッシュタグ */}
              {generatedPost.hashtags?.length > 0 && (
                <div>
                  <div className="text-xs text-[#6b6b8a] mb-2">ハッシュタグ <span className="text-[10px]">（タップでコピー）</span></div>
                  <div className="flex flex-wrap gap-2">
                    {generatedPost.hashtags.map((h: string) => (
                      <span key={h} onClick={() => copyToClipboard(h)} className="badge-cyan cursor-pointer hover:opacity-70 transition-opacity">{h}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {generatedPost.best_time && (
                  <div className="bg-[rgba(255,184,0,0.06)] border border-[rgba(255,184,0,0.15)] rounded-xl p-3">
                    <div className="text-xs text-[#ffb800] mb-1">🕒 最適投稿時間</div>
                    <div className="text-sm font-bold">{generatedPost.best_time}</div>
                  </div>
                )}
                {generatedPost.platform_tip && (
                  <div className="bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.15)] rounded-xl p-3">
                    <div className="text-xs text-[#8b5cf6] mb-1">💡 運用ヒント</div>
                    <div className="text-xs text-[#c8c8e0]">{generatedPost.platform_tip}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button className="flex-1 btn-primary py-3 text-sm font-bold justify-center">📤 今すぐ投稿</button>
                <button className="flex-1 btn-ghost py-3 text-sm justify-center">🕒 予約投稿</button>
                <button onClick={() => { setGeneratedPost(null); generatePost() }} className="px-4 btn-ghost py-3 text-[#6b6b8a]">🔄</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 自動いいね ── */}
      {tab === 'likes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h2 className="font-display text-base font-bold">自動いいね・フォロー設定</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-[#6b6b8a] mb-1.5">媒体</label>
                <select value={jobForm.platform} onChange={e => setJobForm(j => ({ ...j, platform: e.target.value }))} className="input-field">
                  <option value="instagram">Instagram</option><option value="twitter">X (Twitter)</option>
                </select>
              </div>
              <div><label className="block text-xs text-[#6b6b8a] mb-1.5">アクション</label>
                <select value={jobForm.job_type} onChange={e => setJobForm(j => ({ ...j, job_type: e.target.value }))} className="input-field">
                  <option value="like">いいね</option><option value="follow">フォロー</option>
                </select>
              </div>
            </div>
            <div><label className="block text-xs text-[#6b6b8a] mb-1.5">ターゲット種別</label>
              <select value={jobForm.target_type} onChange={e => setJobForm(j => ({ ...j, target_type: e.target.value }))} className="input-field">
                <option value="hashtag">ハッシュタグ</option><option value="keyword">キーワード</option>
                <option value="competitor_followers">競合フォロワー</option><option value="location">場所</option>
              </select>
            </div>
            <div><label className="block text-xs text-[#6b6b8a] mb-1.5">ターゲット値</label>
              <input type="text" value={jobForm.target_value} onChange={e => setJobForm(j => ({ ...j, target_value: e.target.value }))} placeholder="例: エステ 美容" className="input-field" />
            </div>
            <div><label className="block text-xs text-[#6b6b8a] mb-1.5">1日の上限: <span className="text-[#00e5a0] font-bold">{jobForm.daily_limit}回</span></label>
              <input type="range" min={10} max={300} step={10} value={jobForm.daily_limit} onChange={e => setJobForm(j => ({ ...j, daily_limit: Number(e.target.value) }))} className="w-full accent-[#00e5a0]" />
              <div className="flex justify-between text-[10px] text-[#6b6b8a] mt-1"><span>🟢 低〜100</span><span>🟡 中〜200</span><span>🔴 上限300</span></div>
            </div>
            <button onClick={saveJob} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: '#00e5a0', color: '#04040a' }}>♥ ジョブを開始</button>
          </div>
          <div className="card">
            <h2 className="font-display text-base font-bold mb-4">稼働中のジョブ</h2>
            {jobs.length === 0 ? <p className="text-sm text-[#6b6b8a] text-center py-8">ジョブがありません</p> : (
              <div className="space-y-3">{jobs.map(job => (
                <div key={job.id} className="bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${job.is_active ? 'bg-[#00e5a0] animate-pulse' : 'bg-[#6b6b8a]'}`}/>
                      <span className="text-xs font-bold">{PLATFORM_LABELS[job.platform]}</span>
                      <span className="badge-cyan text-[10px]">{job.job_type === 'like' ? '♥' : '+'} {job.job_type}</span>
                    </div>
                    <button onClick={() => fetch('/api/sns/jobs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: job.id, is_active: !job.is_active }) }).then(fetchJobs)}
                      className={`text-xs px-3 py-1 rounded-full border ${job.is_active ? 'border-[#ff4560] text-[#ff4560]' : 'border-[#00e5a0] text-[#00e5a0]'}`}>
                      {job.is_active ? '停止' : '再開'}
                    </button>
                  </div>
                  <p className="text-xs text-[#6b6b8a]">{job.target_value}</p>
                  <div className="mt-2"><div className="flex justify-between text-[10px] text-[#6b6b8a] mb-1"><span>本日</span><span>{job.executed_today}/{job.daily_limit}</span></div>
                    <div className="h-1.5 bg-[#1a1a2e] rounded-full"><div className="h-full bg-[#00e5a0] rounded-full" style={{ width: `${Math.min((job.executed_today/job.daily_limit)*100,100)}%` }}/></div>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}

      {/* ── キーワード返信 ── */}
      {tab === 'triggers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h2 className="font-display text-base font-bold">キーワードトリガー作成</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-[#6b6b8a] mb-1.5">媒体</label>
                <select value={triggerForm.platform} onChange={e => setTriggerForm(t => ({ ...t, platform: e.target.value }))} className="input-field">
                  <option value="instagram">Instagram</option><option value="twitter">X</option>
                </select>
              </div>
              <div><label className="block text-xs text-[#6b6b8a] mb-1.5">種別</label>
                <select value={triggerForm.trigger_type} onChange={e => setTriggerForm(t => ({ ...t, trigger_type: e.target.value }))} className="input-field">
                  <option value="comment">コメント</option><option value="dm">DM</option><option value="mention">メンション</option>
                </select>
              </div>
            </div>
            <div><label className="block text-xs text-[#6b6b8a] mb-1.5">キーワード（カンマ区切り）</label>
              <input type="text" value={triggerForm.keywords} onChange={e => setTriggerForm(t => ({ ...t, keywords: e.target.value }))} placeholder="欲しい, 詳細, プレゼント" className="input-field" />
            </div>
            <div><label className="block text-xs text-[#6b6b8a] mb-1.5">返信テンプレート（{'{URL}'}でURL挿入）</label>
              <textarea value={triggerForm.reply_template} onChange={e => setTriggerForm(t => ({ ...t, reply_template: e.target.value }))} rows={3} placeholder={'ありがとうございます！こちらからどうぞ🎁\n{URL}'} className="input-field resize-none" />
            </div>
            <div><label className="block text-xs text-[#6b6b8a] mb-1.5">送り先URL</label>
              <input type="url" value={triggerForm.destination_url} onChange={e => setTriggerForm(t => ({ ...t, destination_url: e.target.value }))} placeholder="https://example.com" className="input-field" />
            </div>
            <button onClick={async () => { const r = await fetch('/api/sns/triggers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(triggerForm) }); if (r.ok) { toast.success('作成しました'); fetchTriggers() } else toast.error('エラー') }} className="w-full btn-primary justify-center py-3">⚡ トリガーを作成</button>
          </div>
          <div className="card">
            <h2 className="font-display text-base font-bold mb-4">設定済みトリガー</h2>
            {triggers.length === 0 ? <p className="text-sm text-[#6b6b8a] text-center py-8">トリガーがありません</p> : (
              <div className="space-y-3">{triggers.map(t => (
                <div key={t.id} className="bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-1 flex-wrap">{(t.keywords as string[]).map((kw: string) => <span key={kw} className="badge-amber">{kw}</span>)}</div>
                    <button onClick={() => toggleTrigger(t.id, !t.is_active)} className={`w-10 h-5 rounded-full relative transition-colors ${t.is_active ? 'bg-[#00e5a0]' : 'bg-[#252540]'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${t.is_active ? 'left-5' : 'left-0.5'}`}/>
                    </button>
                  </div>
                  <p className="text-xs text-[#6b6b8a] truncate">{t.reply_template}</p>
                  <div className="text-[10px] text-[#6b6b8a] mt-1">{t.platform} · 発動 <span className="text-[#ffb800]">{t.triggered_count}回</span></div>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}

      {/* ── AI自動返答 ── */}
      {tab === 'ai_reply' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h2 className="font-display text-base font-bold">AI自動返答設定</h2>
            {[{ id: 'auto', label: '完全自動モード', desc: 'AIが即座に返答。24時間無人対応。', color: '#00e5a0' },
              { id: 'approval', label: '承認モード（推奨）', desc: 'LINEに送付→承認後に送信。安全重視。', color: '#ffb800' },
              { id: 'hybrid', label: 'ハイブリッド', desc: '一般は自動、クレームは承認待ち。', color: '#8b5cf6' }].map(m => (
              <label key={m.id} className="flex items-start gap-3 p-4 rounded-xl border border-[#1a1a2e] cursor-pointer hover:border-[#252540]">
                <input type="radio" name="mode" value={m.id} defaultChecked={m.id === 'approval'} className="mt-0.5"/>
                <div><div className="text-sm font-bold" style={{ color: m.color }}>{m.label}</div><div className="text-xs text-[#6b6b8a] mt-0.5">{m.desc}</div></div>
              </label>
            ))}
            <div><label className="block text-xs text-[#6b6b8a] mb-1.5">ブランドトーン</label>
              <textarea rows={3} defaultValue="丁寧でフレンドリーなスタッフとして返答してください。絵文字を適度に使い、温かみのある言葉で。" className="input-field resize-none" />
            </div>
            <button className="w-full btn-primary justify-center py-3">設定を保存・有効化</button>
          </div>
          <div className="card">
            <h2 className="font-display text-base font-bold mb-4">承認待ち <span className="text-[#8b5cf6]">{replyQueue.length}件</span></h2>
            {replyQueue.length === 0 ? <p className="text-sm text-[#6b6b8a] text-center py-8">承認待ちはありません</p> : (
              <div className="space-y-4">{replyQueue.map(item => (
                <div key={item.id} className="bg-[#0f0f1e] border border-[rgba(139,92,246,0.2)] rounded-xl p-4">
                  <div className="text-xs text-[#6b6b8a] mb-2">{item.sender_name} · {item.platform}</div>
                  <div className="bg-[rgba(255,255,255,0.04)] rounded-lg p-3 mb-2 text-xs">{item.original_text}</div>
                  <div className="bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.15)] rounded-lg p-3 mb-3 text-xs">
                    <div className="text-[10px] text-[#8b5cf6] mb-1">AI返答案</div>{item.ai_reply}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => { const r = await fetch('/api/sns/webhook', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, status: 'approved' }) }); if (r.ok) { toast.success('承認しました'); fetchReplyQueue() } }} className="flex-1 bg-[#8b5cf6] text-white text-xs font-bold py-2 rounded-lg">承認して送信</button>
                    <button className="px-4 text-xs py-2 rounded-lg border border-[#252540] text-[#6b6b8a]">修正</button>
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
