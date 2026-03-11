'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

const AGENTS = [
  {
    id: 'cmo', name: 'CMOエージェント', num: '01', color: '#ffb800',
    desc: '全体戦略・目標設計・優先施策決定',
    capabilities: ['集客目標の設定', '媒体別優先施策', '季節・業種分析', '週次施策立案'],
    status: 'active',
  },
  {
    id: 'sns', name: 'SNS運用エージェント', num: '02', color: '#00d4ff',
    desc: '投稿・自動いいね・キーワード返信・AI返答',
    capabilities: ['AI投稿文生成', '自動いいね・フォロー', 'キーワード検知・URL発行', 'AI自動返答'],
    status: 'active',
  },
  {
    id: 'lp', name: 'LP改善エージェント', num: '03', color: '#00e5a0',
    desc: 'CVR改善・CTA最適化・構成改善提案',
    capabilities: ['LP離脱率分析', 'CTA文言改善提案', 'FV改善提案', 'フォーム最適化'],
    status: 'waiting',
  },
  {
    id: 'analytics', name: 'データ分析エージェント', num: '04', color: '#8b5cf6',
    desc: 'GA/SNS/LINE集計・異常検知・レポート生成',
    capabilities: ['日次データ集計', '異常値検知・アラート', '週次レポート生成', 'KPI監視'],
    status: 'active',
  },
  {
    id: 'notify', name: '通知エージェント', num: '05', color: '#06c755',
    desc: 'LINE通知・承認受付・実行フロー管理',
    capabilities: ['LINE承認フロー', '提案通知送信', '実行完了通知', '日次レポート送信'],
    status: 'active',
  },
]

const STATUS_LABELS: Record<string, string> = { active: '稼働中', waiting: '提案待ち', paused: '一時停止' }
const STATUS_COLORS: Record<string, string> = { active: 'text-[#00e5a0]', waiting: 'text-[#ffb800]', paused: 'text-[#6b6b8a]' }

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [running, setRunning] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [input, setInput] = useState('')

  async function runAgent(agentId: string) {
    if (!input.trim()) { toast.error('指示を入力してください'); return }
    setRunning(agentId)
    setResult(null)

    const actionMap: Record<string, string> = {
      cmo: 'generate_proposal', sns: 'generate_post', lp: 'generate_proposal', analytics: 'generate_proposal', notify: 'generate_proposal'
    }
    const paramMap: Record<string, any> = {
      cmo: { agentRole: 'cmo', analyticsData: input },
      sns: { platform: 'instagram', topic: input, tone: 'friendly', businessType: '' },
      lp: { agentRole: 'lp', analyticsData: input },
      analytics: { agentRole: 'analytics', analyticsData: input },
      notify: { agentRole: 'cmo', analyticsData: input },
    }

    const r = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionMap[agentId], params: paramMap[agentId] }),
    })
    const data = await r.json()
    if (r.ok) { setResult(data.result); toast.success(`${data.points_used}pt使用`) }
    else toast.error(data.error)
    setRunning(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tighter">AIエージェント</h1>
        <p className="text-sm text-[#6b6b8a] mt-1">5体の専門AIが24時間分業稼働しています</p>
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map(agent => (
          <button key={agent.id} onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
            className={`card text-left transition-all duration-200 border
              ${selectedAgent === agent.id ? `border-[${agent.color}] shadow-[0_0_30px_rgba(0,0,0,0.3)]` : 'hover:-translate-y-1 hover:shadow-lg'}`}
            style={selectedAgent === agent.id ? { borderColor: agent.color + '66' } : {}}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: agent.color }}>AGENT {agent.num}</div>
                <div className="font-display text-sm font-bold text-[#e8e8f4]">{agent.name}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-[#00e5a0] animate-pulse-dot' : agent.status === 'waiting' ? 'bg-[#ffb800]' : 'bg-[#6b6b8a]'}`}/>
                <span className={`text-[10px] font-medium ${STATUS_COLORS[agent.status]}`}>{STATUS_LABELS[agent.status]}</span>
              </div>
            </div>
            <p className="text-xs text-[#6b6b8a] mb-3 leading-relaxed">{agent.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {agent.capabilities.map(cap => (
                <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full border border-[#1a1a2e] text-[#6b6b8a]">{cap}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Selected agent console */}
      {selectedAgent && (() => {
        const agent = AGENTS.find(a => a.id === selectedAgent)!
        return (
          <div className="card border" style={{ borderColor: agent.color + '44' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: agent.color + '18', border: `1px solid ${agent.color}44`, color: agent.color }}>
                {agent.num}
              </div>
              <div>
                <div className="font-display text-sm font-bold">{agent.name} — コンソール</div>
                <div className="text-[10px] text-[#6b6b8a]">指示を入力して即時実行</div>
              </div>
            </div>
            <div className="flex gap-3">
              <textarea value={input} onChange={e => setInput(e.target.value)} rows={3}
                placeholder={
                  agent.id === 'cmo' ? '今月の集客データを元に来週の施策を立案してください...' :
                  agent.id === 'sns' ? '春の新メニューキャンペーンのInstagram投稿を作ってください...' :
                  agent.id === 'lp' ? 'LPのCVRが低下しています。改善提案を出してください...' :
                  agent.id === 'analytics' ? '先月のデータを分析して課題と改善点を教えてください...' :
                  '今日の施策に関するLINE通知を作成してください...'
                }
                className="flex-1 input-field resize-none" />
              <button onClick={() => runAgent(agent.id)} disabled={running === agent.id}
                className="px-6 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                style={{ background: agent.color + '20', color: agent.color, border: `1px solid ${agent.color}44` }}>
                {running === agent.id ? '実行中...' : '実行\n(5pt)'}
              </button>
            </div>

            {result && (
              <div className="mt-4 bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl p-4">
                <div className="text-[10px] text-[#6b6b8a] mb-2 font-bold uppercase tracking-widest">AI出力結果</div>
                {result.title && <div className="text-sm font-bold text-[#e8e8f4] mb-2">{result.title}</div>}
                {result.content && <p className="text-sm text-[#c8c8e0] whitespace-pre-wrap leading-relaxed">{result.content}</p>}
                {result.body && <p className="text-sm text-[#9898b8] leading-relaxed">{result.body}</p>}
                {result.recommendation && <p className="text-sm text-[#9898b8] leading-relaxed mt-1">{result.recommendation}</p>}
                {result.expected_impact && <div className="mt-2 text-xs text-[#00e5a0]">期待効果: {result.expected_impact}</div>}
                {result.expected_cvr_lift && <div className="mt-2 text-xs text-[#00e5a0]">CVR改善予測: {result.expected_cvr_lift}</div>}
                {result.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">{result.hashtags.map((h: string) => <span key={h} className="badge-cyan">{h}</span>)}</div>
                )}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
