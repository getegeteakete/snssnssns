const LINE_API = 'https://api.line.me/v2/bot/message'

interface LineMessage {
  type: 'text' | 'flex'
  text?: string
  altText?: string
  contents?: any
}

async function sendToLine(userId: string, messages: LineMessage[]) {
  const res = await fetch(`${LINE_API}/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ to: userId, messages }),
  })
  if (!res.ok) throw new Error(`LINE API error: ${res.status} ${await res.text()}`)
  return res.json()
}

// ── Proposal notification with approve/reject buttons ─────────
export async function sendProposalNotification(lineUserId: string, proposal: {
  id: string; title: string; body: string; priority: string; expected_impact?: string
}) {
  const priorityEmoji = proposal.priority === 'high' ? '🔴' : proposal.priority === 'medium' ? '🟡' : '🟢'
  await sendToLine(lineUserId, [{
    type: 'flex',
    altText: `[AIMO提案] ${proposal.title}`,
    contents: {
      type: 'bubble',
      styles: { header: { backgroundColor: '#0a0a14' }, body: { backgroundColor: '#0f0f1e' }, footer: { backgroundColor: '#0f0f1e' } },
      header: {
        type: 'box', layout: 'horizontal', contents: [
          { type: 'text', text: `${priorityEmoji} AIMO 改善提案`, color: '#00d4ff', size: 'sm', weight: 'bold' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md', contents: [
          { type: 'text', text: proposal.title, color: '#e8e8f4', weight: 'bold', size: 'md', wrap: true },
          { type: 'text', text: proposal.body, color: '#9898b8', size: 'sm', wrap: true },
          ...(proposal.expected_impact ? [
            { type: 'text', text: `💡 期待効果: ${proposal.expected_impact}`, color: '#00e5a0', size: 'xs', wrap: true }
          ] : [])
        ]
      },
      footer: {
        type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
          {
            type: 'button', style: 'primary', color: '#00d4ff',
            action: { type: 'postback', label: '✓ 承認', data: `action=approve&id=${proposal.id}` }
          },
          {
            type: 'button', style: 'secondary',
            action: { type: 'postback', label: '✕ 却下', data: `action=reject&id=${proposal.id}` }
          }
        ]
      }
    }
  }])
}

// ── Daily report ──────────────────────────────────────────────
export async function sendDailyReport(lineUserId: string, report: {
  date: string; pv: number; cv: number; cvr: string
  top_post?: string; alert?: string
}) {
  const text = [
    `📊 AIMO 日次レポート ${report.date}`,
    `━━━━━━━━━━━━━━`,
    `👁 アクセス: ${report.pv.toLocaleString()}`,
    `✅ CV数: ${report.cv}件`,
    `📈 CVR: ${report.cvr}%`,
    report.top_post ? `🏆 人気投稿: ${report.top_post}` : '',
    report.alert ? `\n⚠️ アラート: ${report.alert}` : '',
  ].filter(Boolean).join('\n')

  await sendToLine(lineUserId, [{ type: 'text', text }])
}

// ── Warning alert ────────────────────────────────────────────
export async function sendWarningAlert(lineUserId: string, warning: {
  title: string; detail: string; action?: string
}) {
  await sendToLine(lineUserId, [{
    type: 'text',
    text: `⚠️ AIMO 警告アラート\n\n${warning.title}\n${warning.detail}${warning.action ? `\n\n推奨アクション: ${warning.action}` : ''}`,
  }])
}

// ── Execution complete ────────────────────────────────────────
export async function sendExecutionComplete(lineUserId: string, task: string) {
  await sendToLine(lineUserId, [{
    type: 'text',
    text: `✅ 実行完了\n\n${task}\n\nAIMOが正常に実行しました。`
  }])
}

// ── LINE Webhook handler (parse postback) ─────────────────────
export function parseLineWebhook(body: any): Array<{ type: string; replyToken?: string; data?: string; userId: string }> {
  const events = body.events || []
  return events.map((e: any) => ({
    type: e.type,
    replyToken: e.replyToken,
    data: e.postback?.data,
    userId: e.source?.userId,
    message: e.message?.text,
  }))
}
