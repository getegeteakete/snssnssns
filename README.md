# AIMO — AI Marketing Operator

> 売上を作りにいくAI宣伝エージェント

## 技術スタック

- **フロント**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **DB/Auth**: Supabase (PostgreSQL + RLS)
- **決済**: Stripe (サブスク + 都度課金 + Connect)
- **AI**: Claude API (Anthropic)
- **通知**: LINE Messaging API
- **SNS**: X API v2 / Instagram Graph API
- **GMB**: Google Business Profile API
- **デプロイ**: Vercel

---

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して各APIキーを設定してください。

### 3. Supabase セットアップ

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. SQL Editorで `supabase/schema.sql` を実行
3. Authentication → Google OAuth を有効化
4. `.env.local` に URL と API キーを設定

### 4. Stripe セットアップ

1. [stripe.com](https://stripe.com) でアカウント作成
2. 以下の商品を作成:
   - サブスク: Starter (¥3,900/月), Pro (¥6,900/月), Business (¥14,800/月)
   - 都度: Points 100pt (¥1,000), 550pt (¥5,000), 1200pt (¥10,000)
3. 各 Price ID を `.env.local` に設定
4. Webhook エンドポイントを `https://yourdomain.com/api/webhook` に設定

### 5. LINE Messaging API セットアップ

1. LINE Developers Console でチャネル作成
2. Messaging API を有効化
3. Webhook URL を `https://yourdomain.com/api/line` に設定
4. チャネルアクセストークンとシークレットを `.env.local` に設定

### 6. Anthropic API

1. [console.anthropic.com](https://console.anthropic.com) でAPIキー取得
2. `.env.local` に `ANTHROPIC_API_KEY` を設定

### 7. ローカル開発

```bash
npm run dev
```

### 8. Vercel デプロイ

1. GitHub にプッシュ
2. Vercel でプロジェクトを接続
3. 環境変数を Vercel ダッシュボードで設定
4. デプロイ実行

---

## アーキテクチャ

```
src/
├── app/
│   ├── auth/           # ログイン・登録
│   ├── dashboard/      # 会員ダッシュボード全ページ
│   │   ├── page.tsx         # メインダッシュボード
│   │   ├── agents/          # AIエージェント
│   │   ├── sns/             # SNS自動化
│   │   ├── gmb/             # Googleマイビジネス
│   │   ├── analytics/       # 分析
│   │   ├── affiliate/       # アフィリエイト
│   │   ├── billing/         # 課金管理
│   │   └── settings/        # 設定
│   └── api/
│       ├── agents/          # Claude AI エージェント
│       ├── stripe/          # Stripe 決済
│       ├── webhook/         # Stripe Webhook
│       ├── line/            # LINE Webhook
│       ├── sns/             # SNS自動化 API
│       │   ├── triggers/    # キーワードトリガー
│       │   ├── jobs/        # 自動いいね/フォロー
│       │   └── webhook/     # 受信コメント処理
│       ├── gmb/             # GMB 投稿管理
│       ├── affiliate/       # アフィリエイト
│       ├── analytics/       # 分析データ
│       └── cron/            # 定期実行ジョブ
├── components/
│   ├── dashboard/      # ダッシュボードUIコンポーネント
│   └── auth/
├── lib/
│   ├── supabase/       # DB クライアント
│   ├── stripe/         # Stripe ユーティリティ
│   ├── anthropic/      # Claude AI エージェントエンジン
│   ├── line/           # LINE 通知ユーティリティ
│   └── gmb/            # GMB API ユーティリティ
└── types/
    └── database.ts     # TypeScript 型定義
```

---

## 機能一覧

### 会員機能
- [x] Supabase Auth (Email + Google OAuth)
- [x] プロフィール自動作成 (DB Trigger)
- [x] プラン別機能制限

### SNS自動化
- [x] AI投稿文生成 (Claude API)
- [x] 自動いいね・フォロー設定
- [x] キーワードトリガー → 自動返信 + URL発行
- [x] AI自動返答 (承認/自動/ハイブリッドモード)

### GMB
- [x] AI投稿文生成
- [x] 予約投稿管理
- [x] Google Business Profile API 連携

### 分析
- [x] 日次KPI集計
- [x] AIインサイト生成
- [x] Recharts グラフ表示

### 課金
- [x] Stripe サブスクリプション
- [x] ポイント都度購入
- [x] Webhook による自動プラン更新

### LINE連携
- [x] 日次レポート自動送信
- [x] 提案通知 + 承認ボタン
- [x] Webhook による承認受付

### アフィリエイト
- [x] AIMO紹介プログラム
- [x] EC アフィリエイター管理 (Business+)
- [x] クリック追跡 / Cookie管理

### 定期実行 (Vercel Cron)
- [x] 毎朝8時 日次レポート送信
- [x] 毎月曜 週次CMO提案生成
- [x] 5分ごと 予約投稿の公開
- [x] 3時間ごと 自動いいねジョブ実行
