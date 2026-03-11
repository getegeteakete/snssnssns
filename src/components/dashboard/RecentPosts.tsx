'use client'
import type { Post } from '@/types/database'

const statusLabels: Record<string, { label: string; class: string }> = {
  published: { label: '公開済', class: 'badge-green' },
  scheduled:  { label: '予約済', class: 'badge-cyan' },
  draft:      { label: '下書き', class: 'text-[#6b6b8a] border-[#252540]' },
  failed:     { label: '失敗',   class: 'badge-red' },
}
const platformIcons: Record<string, string> = {
  twitter: '𝕏', instagram: 'IG', facebook: 'FB', line_official: 'LINE', gmb: 'GMB'
}

export default function RecentPosts({ posts }: { posts: Post[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-bold">最近の投稿</h2>
        <a href="/dashboard/sns" className="text-xs text-[#00d4ff] hover:underline">すべて見る</a>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-10 text-[#6b6b8a] text-sm">
          まだ投稿がありません。<br/>
          <a href="/dashboard/sns" className="text-[#00d4ff] hover:underline">SNS自動化</a>から最初の投稿を作成しましょう
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const s = statusLabels[post.status] || statusLabels.draft
            return (
              <div key={post.id} className="bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#6b6b8a] bg-[#1a1a2e] px-2 py-0.5 rounded">
                      {platformIcons[post.platform] || post.platform}
                    </span>
                    <span className={`badge ${s.class}`}>{s.label}</span>
                    {post.ai_generated && <span className="badge badge-cyan">AI生成</span>}
                  </div>
                  <span className="text-[10px] text-[#6b6b8a]">
                    {new Date(post.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <p className="text-xs text-[#9898b8] leading-relaxed line-clamp-2">{post.content}</p>
                <div className="flex gap-4 mt-2 text-[10px] text-[#6b6b8a]">
                  <span>♡ {post.likes_count}</span>
                  <span>💬 {post.comments_count}</span>
                  <span>👁 {post.impressions}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
