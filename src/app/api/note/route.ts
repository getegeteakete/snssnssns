import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/client'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Note記事をAI生成 ───────────────────────────────────────
async function generateNoteArticle(params: {
  topic: string
  businessType: string
  tone: string
  articleType: string
  targetLength: string
}) {
  const lengthGuide: Record<string, string> = {
    short: '800〜1200文字',
    medium: '1500〜2500文字',
    long: '3000〜5000文字',
  }
  const typeGuide: Record<string, string> = {
    knowledge: '専門知識・ノウハウ共有記事',
    story: 'ストーリー・体験談記事',
    tips: 'お役立ちTips・リスト記事',
    case_study: '事例・ケーススタディ記事',
    opinion: 'オピニオン・考察記事',
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: `あなたはNote（note.com）専門のコンテンツライターです。
読者に価値を届け、フォロワーを増やし、最終的に集客につながる記事を書きます。
Note特有の親しみやすいトーン、適切な改行、絵文字の使い方を熟知しています。
回答は必ず以下のJSON形式のみで返してください（マークダウンコードブロック不要）：
{
  "title": "記事タイトル",
  "body": "記事本文（Note形式、改行・見出し付き）",
  "hashtags": ["タグ1", "タグ2", "タグ3"],
  "summary": "100文字以内の記事概要",
  "seo_keywords": ["キーワード1", "キーワード2"]
}`,
    messages: [{
      role: 'user',
      content: `以下の条件でNote記事を生成してください：

【業種・ビジネス】${params.businessType || '未指定'}
【テーマ・トピック】${params.topic}
【記事種類】${typeGuide[params.articleType] || params.articleType}
【文字数目安】${lengthGuide[params.targetLength] || '1500〜2500文字'}
【トーン】${params.tone === 'friendly' ? 'フレンドリー・親しみやすい' : params.tone === 'professional' ? 'プロフェッショナル・信頼感' : 'カジュアル・ライト'}

Note記事として最適な構成で書いてください。
- 冒頭で読者の興味を引くフック
- 見出し（##）で読みやすく構成
- 具体的なエピソードや数字を含める
- 最後に行動を促すまとめ
- Noteらしい親しみやすい表現`
    }]
  })

  const text = response.content.find(c => c.type === 'text')?.text || '{}'
  const clean = text.replace(/```json\n?|```\n?/g, '').trim()
  return JSON.parse(clean)
}

// ── Noteへ投稿（非公式API）───────────────────────────────────
async function postToNote(params: {
  noteEmail: string
  notePassword: string
  title: string
  body: string
  hashtags: string[]
  status: 'draft' | 'published'
}) {
  // Step 1: ログイン
  const loginRes = await fetch('https://note.com/api/v1/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://note.com/login',
    },
    body: JSON.stringify({ login: params.noteEmail, password: params.notePassword }),
  })

  if (!loginRes.ok) {
    throw new Error('Noteのログインに失敗しました。メールアドレスとパスワードを確認してください。')
  }

  // クッキーを取得
  const cookies = loginRes.headers.get('set-cookie') || ''
  const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('_note_session'))?.trim() || ''

  const loginData = await loginRes.json()
  const userId = loginData.data?.id || ''

  if (!userId) throw new Error('ユーザー情報の取得に失敗しました')

  // Step 2: 記事を作成
  const bodyWithTags = params.body + '\n\n' + params.hashtags.map(t => `#${t}`).join(' ')

  const createRes = await fetch('https://note.com/api/v2/text_notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://note.com/notes/new',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({
      name: params.title,
      body: bodyWithTags,
      status: params.status === 'published' ? 'public' : 'draft',
      can_comment: true,
      price: 0,
    }),
  })

  if (!createRes.ok) {
    const errText = await createRes.text()
    throw new Error(`Note投稿に失敗しました: ${createRes.status} ${errText.slice(0, 100)}`)
  }

  const createData = await createRes.json()
  const noteKey = createData.data?.key || ''
  const noteUrl = noteKey ? `https://note.com/${createData.data?.user?.urlname}/n/${noteKey}` : ''

  return { noteKey, noteUrl, userId }
}

// ── GET: Note投稿一覧 ─────────────────────────────────────
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', 'note')
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json(data || [])
}

// ── POST: 生成 or 投稿 ────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { action } = body

  // ── 記事生成（5pt）─────────────────────────────────────
  if (action === 'generate') {
    const { data: profile } = await supabase.from('profiles').select('points').eq('id', user.id).single()
    if (!profile || profile.points < 5) {
      return NextResponse.json({ error: 'ポイントが不足しています', code: 'insufficient_points' }, { status: 402 })
    }

    try {
      const result = await generateNoteArticle(body.params)
      const newBalance = profile.points - 5
      await supabase.from('profiles').update({ points: newBalance }).eq('id', user.id)
      await supabase.from('point_transactions').insert({
        user_id: user.id, type: 'use', amount: -5, balance_after: newBalance,
        description: 'Note記事生成 (5pt)'
      })
      return NextResponse.json({ result, points_used: 5, points_remaining: newBalance })
    } catch (e: any) {
      return NextResponse.json({ error: 'AI生成に失敗しました: ' + e.message }, { status: 500 })
    }
  }

  // ── Note投稿（下書き or 公開）──────────────────────────
  if (action === 'post') {
    const { noteEmail, notePassword, title, body: articleBody, hashtags, status } = body

    if (!noteEmail || !notePassword) {
      return NextResponse.json({ error: 'NoteのメールアドレスとパスワードをAI設定に登録してください' }, { status: 400 })
    }

    try {
      const { noteKey, noteUrl } = await postToNote({
        noteEmail, notePassword, title,
        body: articleBody, hashtags: hashtags || [],
        status: status || 'draft',
      })

      // DBに保存
      await supabase.from('posts').insert({
        user_id: user.id,
        platform: 'note',
        content: `${title}\n\n${articleBody}`,
        status: status === 'published' ? 'published' : 'draft',
        published_at: status === 'published' ? new Date().toISOString() : null,
        platform_post_id: noteKey,
      })

      return NextResponse.json({ ok: true, noteUrl, noteKey })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  // ── Note認証情報の保存 ─────────────────────────────────
  if (action === 'save_credentials') {
    const { noteEmail, notePassword } = body
    const admin = createAdminClient() as any

    // 暗号化せずにDBへ（本番はEncrypt推奨）
    const { error } = await admin.from('profiles').update({
      note_email: noteEmail,
      note_password: notePassword,
    }).eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
