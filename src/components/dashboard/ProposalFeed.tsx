'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AiProposal } from '@/types/database'
import toast from 'react-hot-toast'

const priorityColors = { high: 'badge-red', medium: 'badge-amber', low: 'badge-cyan' }
const agentLabels = { cmo: 'CMO', sns: 'SNS', lp: 'LP改善', analytics: '分析', notify: '通知' }

export default function ProposalFeed({ proposals: initial }: { proposals: AiProposal[] }) {
  const [proposals, setProposals] = useState(initial)
  const supabase = createClient()

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    const { error } = await supabase.from('ai_proposals')
      .update({ status: action, approved_at: action === 'approved' ? new Date().toISOString() : null })
      .eq('id', id)

    if (error) { toast.error('操作に失敗しました'); return }
    setProposals(p => p.filter(x => x.id !== id))
    toast.success(action === 'approved' ? '✓ 承認しました' : '却下しました')
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ffb800] animate-pulse-dot"/>
          AI改善提案
        </h2>
        <span className="text-xs text-[#6b6b8a]">{proposals.length}件 承認待ち</span>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-10 text-[#6b6b8a] text-sm">
          現在、承認待ちの提案はありません
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map(p => (
            <div key={p.id} className="bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${priorityColors[p.priority]}`}>{p.priority === 'high' ? '重要' : p.priority === 'medium' ? '通常' : '低'}</span>
                  <span className="badge badge-cyan">{agentLabels[p.agent]}</span>
                </div>
                <span className="text-[10px] text-[#6b6b8a] whitespace-nowrap">
                  {new Date(p.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#e8e8f4] mb-1">{p.title}</h3>
              <p className="text-xs text-[#6b6b8a] leading-relaxed mb-3">{p.body}</p>
              {p.expected_impact && (
                <div className="text-xs text-[#00e5a0] mb-3">期待効果: {p.expected_impact}</div>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleAction(p.id, 'approved')}
                  className="flex-1 bg-[#00d4ff] text-[#04040a] text-xs font-bold py-2 rounded-lg hover:bg-[#00bfe6] transition-colors">
                  承認して実行
                </button>
                <button onClick={() => handleAction(p.id, 'rejected')}
                  className="px-4 bg-transparent border border-[#252540] text-[#6b6b8a] text-xs py-2 rounded-lg hover:border-[#ff4560] hover:text-[#ff4560] transition-colors">
                  却下
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
