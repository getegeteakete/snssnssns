'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const POST_TYPES = [
  { id: 'whats_new', label: '最新情報', color: 'cyan' },
  { id: 'offer',     label: '特典・クーポン', color: 'amber' },
  { id: 'event',     label: 'イベント', color: 'green' },
  { id: 'product',   label: '商品・サービス', color: 'purple' },
]

export default function GmbPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({ location_id: '', location_name: '', post_type: 'whats_new', title: '', topic: '', cta_type: 'LEARN_MORE', cta_url: '', event_start: '', event_end: '' })
  const [generated, setGenerated] = useState<any>(null)
  const [view, setView] = useState<'list' | 'create'>('list')

  useEffect(() => { fetchPosts() }, [])

  async function fetchPosts() {
    const r = await fetch('/api/gmb')
    if (r.ok) setPosts(await r.json())
  }

  async function generatePost() {
    if (!form.topic) { toast.error('内容を入力してください'); return }
    setGenerating(true)
    const r = await fetch('/api/gmb', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate', params: { businessName: form.location_name || '店舗', postType: form.post_type, topic: form.topic } }) })
    const data = await r.json()
    if (r.ok) { setGenerated(data.result); toast.success(`生成完了 (5pt使用)`) }
    else toast.error(data.error)
    setGenerating(false)
  }

  async function savePost(status: 'draft' | 'scheduled') {
    const content = generated?.content || ''
    if (!content) { toast.error('先に投稿文を生成してください'); return }
    const r = await fetch('/api/gmb', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', ...form, content }) })
    const data = await r.json()
    if (r.ok) { toast.success(status === 'draft' ? '下書きを保存しました' : '予約投稿しました'); fetchPosts(); setView('list') }
    else toast.error(data.error)
  }

  async function publishPost(id: string) {
    const r = await fetch('/api/gmb', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'publish', post_id: id }) })
    const data = await r.json()
    if (r.ok) { toast.success('Googleビジネスプロフィールに投稿しました'); fetchPosts() }
    else toast.error(data.error)
  }

  const statusColors: Record<string, string> = {
    published: 'badge-green', scheduled: 'badge-cyan', draft: 'text-[#6b6b8a] border-[#252540]', failed: 'badge-red'
  }
  const statusLabels: Record<string, string> = { published: '公開済', scheduled: '予約済', draft: '下書き', failed: '失敗' }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tighter">Googleマイビジネス</h1>
          <p className="text-sm text-[#6b6b8a] mt-1">MEO対策・来店促進の投稿をAIが自動生成・投稿</p>
        </div>
        <button onClick={() => setView(view === 'list' ? 'create' : 'list')} className="btn-primary text-sm py-2.5 px-5">
          {view === 'list' ? '+ 新規投稿作成' : '← 一覧に戻る'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '公開済み投稿', value: posts.filter(p => p.status === 'published').length, color: 'text-[#00e5a0]' },
          { label: '予約済み', value: posts.filter(p => p.status === 'scheduled').length, color: 'text-[#00d4ff]' },
          { label: '総表示回数', value: posts.reduce((s, p) => s + p.view_count, 0).toLocaleString(), color: 'text-[#ffb800]' },
          { label: '総クリック', value: posts.reduce((s, p) => s + p.click_count, 0).toLocaleString(), color: 'text-[#8b5cf6]' },
        ].map(s => (
          <div key={s.label} className="card-hover text-center">
            <div className={`font-display text-3xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-[#6b6b8a] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {view === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="card space-y-4">
            <h2 className="font-display text-base font-bold">投稿作成</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6b6b8a] mb-1.5">店舗名</label>
                <input type="text" value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} placeholder="〇〇サロン 渋谷店" className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-[#6b6b8a] mb-1.5">ロケーションID</label>
                <input type="text" value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))} placeholder="1234567890" className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-2">投稿タイプ</label>
              <div className="grid grid-cols-2 gap-2">
                {POST_TYPES.map(t => (
                  <button key={t.id} onClick={() => setForm(f => ({ ...f, post_type: t.id }))}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all
                      ${form.post_type === t.id
                        ? t.color === 'cyan' ? 'bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border-[rgba(0,212,255,0.3)]'
                        : t.color === 'amber' ? 'bg-[rgba(255,184,0,0.12)] text-[#ffb800] border-[rgba(255,184,0,0.3)]'
                        : t.color === 'green' ? 'bg-[rgba(0,229,160,0.12)] text-[#00e5a0] border-[rgba(0,229,160,0.3)]'
                        : 'bg-[rgba(139,92,246,0.12)] text-[#8b5cf6] border-[rgba(139,92,246,0.3)]'
                        : 'border-[#1a1a2e] text-[#6b6b8a] hover:border-[#252540]'
                      }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#6b6b8a] mb-1.5">投稿内容・テーマ</label>
              <textarea value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} rows={3} placeholder="例: 春の新メニュー、毛穴ケアコース50%OFF期間限定" className="input-field resize-none" />
            </div>
            {form.post_type === 'event' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#6b6b8a] mb-1.5">開始日</label>
                  <input type="date" value={form.event_start} onChange={e => setForm(f => ({ ...f, event_start: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-[#6b6b8a] mb-1.5">終了日</label>
                  <input type="date" value={form.event_end} onChange={e => setForm(f => ({ ...f, event_end: e.target.value }))} className="input-field" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6b6b8a] mb-1.5">CTA種別</label>
                <select value={form.cta_type} onChange={e => setForm(f => ({ ...f, cta_type: e.target.value }))} className="input-field">
                  <option value="LEARN_MORE">詳しく見る</option>
                  <option value="BOOK">予約する</option>
                  <option value="ORDER">注文する</option>
                  <option value="CALL">電話する</option>
                  <option value="SIGN_UP">登録する</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6b6b8a] mb-1.5">CTA URL</label>
                <input type="url" value={form.cta_url} onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))} placeholder="https://example.com" className="input-field" />
              </div>
            </div>
            <button onClick={generatePost} disabled={generating} className="w-full btn-cyan justify-center py-3 disabled:opacity-50">
              {generating ? '生成中...' : '✦ AI投稿文を生成 (5pt)'}
            </button>
          </div>

          {/* Preview */}
          <div className="card space-y-4">
            <h2 className="font-display text-base font-bold text-[#00d4ff]">プレビュー</h2>
            {generated ? (
              <>
                <div className="bg-[#0f0f1e] border border-[rgba(0,212,255,0.15)] rounded-xl p-4">
                  <div className="text-xs text-[rgba(66,133,244,0.8)] mb-2 font-bold">Google ビジネスプロフィール投稿</div>
                  <p className="text-sm text-[#c8c8e0] leading-relaxed whitespace-pre-wrap">{generated.content}</p>
                  {form.cta_type && (
                    <div className="mt-3 inline-block text-xs font-bold text-[#4285f4] border border-[rgba(66,133,244,0.3)] px-3 py-1.5 rounded-lg">
                      {form.cta_type === 'BOOK' ? '予約する' : form.cta_type === 'LEARN_MORE' ? '詳しく見る' : form.cta_type} →
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => savePost('draft')} className="flex-1 btn-ghost py-2.5 text-xs justify-center">下書き保存</button>
                  <button onClick={() => savePost('scheduled')} className="flex-1 btn-primary py-2.5 text-xs justify-center">予約投稿</button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-[#6b6b8a] text-sm">
                AIが投稿文を生成するとここに表示されます
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Posts list */
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold">投稿一覧</h2>
          </div>
          {posts.length === 0 ? (
            <div className="text-center py-16 text-[#6b6b8a]">
              <div className="text-4xl mb-4">📍</div>
              <p className="text-sm mb-2">GMB投稿がありません</p>
              <button onClick={() => setView('create')} className="btn-primary text-sm py-2 px-6">最初の投稿を作成</button>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${statusColors[post.status]}`}>{statusLabels[post.status]}</span>
                      <span className="badge badge-cyan">{POST_TYPES.find(t => t.id === post.post_type)?.label}</span>
                    </div>
                    <p className="text-sm text-[#c8c8e0] line-clamp-2 leading-relaxed">{post.content}</p>
                    <div className="flex gap-4 mt-2 text-[10px] text-[#6b6b8a]">
                      <span>👁 {post.view_count}</span>
                      <span>👆 {post.click_count}</span>
                      <span>{new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                    </div>
                  </div>
                  {post.status === 'draft' && (
                    <button onClick={() => publishPost(post.id)} className="btn-cyan text-xs py-2 px-4 whitespace-nowrap flex-shrink-0">
                      今すぐ投稿
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
