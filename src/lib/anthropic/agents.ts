import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type AgentRole = 'cmo' | 'sns' | 'lp' | 'analytics' | 'reply'

const SYSTEM_PROMPTS: Record<AgentRole, string> = {
  cmo: `あなたはAIMOのCMOエージェントです。集客戦略の専門家として、データに基づいた実践的な施策を提案します。
回答は必ず以下のJSON形式で返してください：
{ "title": "提案タイトル", "body": "詳細説明", "priority": "high|medium|low", "expected_impact": "期待効果", "category": "カテゴリ" }`,

  sns: `あなたはAIMOのSNS運用エージェントです。ターゲット・媒体・目的に最適化したSNS投稿文を生成します。
回答はJSONで返してください：
{ "content": "投稿文", "hashtags": ["#タグ1","#タグ2"], "best_time": "HH:MM", "platform_tip": "媒体別アドバイス" }`,

  lp: `あなたはAIMOのLP改善エージェントです。CVR改善に特化した提案を行います。
回答はJSONで返してください：
{ "title": "改善提案", "body": "詳細", "priority": "high|medium|low", "expected_cvr_lift": "CVR改善予測", "section": "改善箇所" }`,

  analytics: `あなたはAIMOのデータ分析エージェントです。分析データから洞察を見つけ、改善アクションを提案します。
回答はJSONで返してください：
{ "insight": "発見した洞察", "recommendation": "推奨アクション", "data_points": ["データポイント1"], "priority": "high|medium|low" }`,

  reply: `あなたはSNSの自動返答AIです。ブランドトーンを守りながら、自然な日本語でコメント・DMに返答します。
簡潔かつ親切に、ブランドらしさを保って回答してください。
回答はJSONで返してください：
{ "reply": "返答文", "tone": "friendly|professional|apologetic", "type": "general|complaint|inquiry|praise" }`,
}

export async function runAgent(role: AgentRole, userMessage: string, context?: string): Promise<any> {
  const messages: Anthropic.Messages.MessageParam[] = []

  if (context) {
    messages.push({ role: 'user', content: `コンテキスト情報:\n${context}` })
    messages.push({ role: 'assistant', content: 'コンテキストを理解しました。' })
  }
  messages.push({ role: 'user', content: userMessage })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPTS[role],
    messages,
  })

  const text = response.content.find(c => c.type === 'text')?.text || '{}'

  try {
    // Strip possible markdown code fences
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return { raw: text }
  }
}

// ── Generate SNS post ────────────────────────────────────────
export async function generateSnsPost(params: {
  platform: string
  topic: string
  tone: string
  businessType: string
  targetAudience: string
}) {
  const message = `
媒体: ${params.platform}
業種: ${params.businessType}
トピック: ${params.topic}
トーン: ${params.tone}
ターゲット: ${params.targetAudience}

上記の条件で、${params.platform}に最適化した投稿文を生成してください。
`
  return runAgent('sns', message)
}

// ── Generate AI reply ─────────────────────────────────────────
export async function generateAiReply(params: {
  originalText: string
  senderName: string
  brandTone: string
  platform: string
}) {
  const message = `
プラットフォーム: ${params.platform}
ブランドトーン: ${params.brandTone}
送信者名: ${params.senderName}
受信メッセージ: "${params.originalText}"

上記のメッセージへの返答を生成してください。
`
  return runAgent('reply', message)
}

// ── Generate GMB post ─────────────────────────────────────────
export async function generateGmbPost(params: {
  businessName: string
  postType: string
  topic: string
  season?: string
}) {
  const message = `
店舗名: ${params.businessName}
投稿タイプ: ${params.postType}
トピック/内容: ${params.topic}
${params.season ? `季節: ${params.season}` : ''}

Googleビジネスプロフィール向けの投稿文を生成してください。
240文字以内で、CTAを含め、来店・問い合わせを促す内容にしてください。
`
  return runAgent('sns', message)
}

// ── Generate improvement proposal ─────────────────────────────
export async function generateProposal(params: {
  analyticsData: string
  agentRole: AgentRole
}) {
  return runAgent(params.agentRole, `以下のデータを分析して改善提案を生成してください:\n${params.analyticsData}`)
}
