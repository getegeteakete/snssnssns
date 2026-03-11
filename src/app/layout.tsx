import type { Metadata } from 'next'
import { Syne, Noto_Sans_JP } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const syne = Syne({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-syne' })
const noto = Noto_Sans_JP({ subsets: ['latin'], weight: ['300', '400', '500', '700', '900'], variable: '--font-noto' })

export const metadata: Metadata = {
  title: 'AIMO — 売上を作りにいくAI宣伝エージェント',
  description: '戦略立案からGoogleマイビジネス自動投稿まで。売上直結の宣伝サイクルをすべて自動化するAIエージェント。',
  keywords: ['AI宣伝', 'SNS自動投稿', 'Googleマイビジネス', 'MEO', 'マーケティング自動化'],
  openGraph: {
    title: 'AIMO — 売上を作りにいくAI宣伝エージェント',
    description: '投稿するAIは古い。AIMOは戦略立案から実行・学習まで全自動。',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${syne.variable} ${noto.variable}`}>
      <body className="bg-[#04040a] text-[#e8e8f4] font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#0f0f1e', color: '#e8e8f4', border: '1px solid #1a1a2e' },
            success: { iconTheme: { primary: '#00e5a0', secondary: '#04040a' } },
            error: { iconTheme: { primary: '#ff4560', secondary: '#04040a' } },
          }}
        />
      </body>
    </html>
  )
}
