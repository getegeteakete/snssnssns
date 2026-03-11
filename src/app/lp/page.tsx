// LP is served as /index.html in the snssnssns repo (separate from this app)
// This page provides a clean fallback
import Link from 'next/link'

export default function LpPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#04040a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, fontFamily: 'sans-serif', color: '#e8e8f4' }}>
      <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px' }}>AIMO</div>
      <div style={{ color: '#6b6b8a', fontSize: 14 }}>売上を作りにいくAI宣伝エージェント</div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <Link href="/auth/register" style={{ background: '#ffb800', color: '#04040a', padding: '12px 28px', borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          無料で始める →
        </Link>
        <Link href="/auth/login" style={{ background: 'transparent', color: '#e8e8f4', padding: '12px 28px', borderRadius: 999, fontWeight: 500, fontSize: 14, textDecoration: 'none', border: '1px solid #252540' }}>
          ログイン
        </Link>
      </div>
    </div>
  )
}
