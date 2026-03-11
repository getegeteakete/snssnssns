import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#04040a',
      color: '#e8e8f4',
      fontFamily: "'Syne', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.3em', color: '#00d4ff', fontWeight: 700, marginBottom: '0.5rem' }}>
          AI MARKETING OPERATOR
        </div>
        <div style={{ fontSize: '64px', fontWeight: 900, letterSpacing: '-3px', lineHeight: 1 }}>
          AIMO
        </div>
      </div>

      {/* Tagline */}
      <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '1rem', color: '#e8e8f4' }}>
        売上を作りにいくAI宣伝エージェント
      </div>
      <div style={{ fontSize: '14px', color: '#6b6b8a', maxWidth: '480px', lineHeight: 1.8, marginBottom: '2.5rem' }}>
        戦略立案 → コンテンツ制作 → SNS自動投稿 → データ分析 → 改善提案 → LINE承認 → 実行<br/>
        全サイクルをAIが自律的に回します
      </div>

      {/* Cost comparison */}
      <div style={{
        display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap', justifyContent: 'center'
      }}>
        {[
          { label: '人件費（月）', value: '¥174,800', color: '#ff4560', strike: true },
          { label: 'AIMO Pro（月）', value: '¥6,900', color: '#00e5a0' },
          { label: '年間削減', value: '¥2,014,800', color: '#ffb800' },
        ].map(item => (
          <div key={item.label} style={{
            background: '#0a0a14', border: '1px solid #1a1a2e',
            borderRadius: '16px', padding: '1.25rem 1.5rem', minWidth: '140px'
          }}>
            <div style={{ fontSize: '11px', color: '#6b6b8a', marginBottom: '0.5rem' }}>{item.label}</div>
            <div style={{
              fontSize: '22px', fontWeight: 900, color: item.color,
              textDecoration: item.strike ? 'line-through' : 'none'
            }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/auth/register" style={{
          background: '#ffb800', color: '#04040a',
          padding: '14px 36px', borderRadius: '999px',
          fontWeight: 800, fontSize: '15px', textDecoration: 'none',
          letterSpacing: '-0.3px'
        }}>
          無料で始める（30pt付き）→
        </Link>
        <Link href="/auth/login" style={{
          background: 'transparent', color: '#e8e8f4',
          padding: '14px 32px', borderRadius: '999px',
          fontWeight: 600, fontSize: '15px', textDecoration: 'none',
          border: '1px solid #252540'
        }}>
          ログイン
        </Link>
      </div>

      {/* Features */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem', marginTop: '4rem', maxWidth: '800px', width: '100%'
      }}>
        {[
          { icon: '🤖', title: 'CMOエージェント', desc: '戦略立案・施策優先順位' },
          { icon: '📱', title: 'SNS自動化', desc: '投稿・いいね・キーワード返信' },
          { icon: '📍', title: 'Googleマイビジネス', desc: 'MEO対策投稿を自動生成' },
          { icon: '📊', title: 'データ分析', desc: 'KPI監視・異常検知・レポート' },
          { icon: '✅', title: 'LINE承認フロー', desc: '提案通知→承認→自動実行' },
          { icon: '💰', title: 'アフィリエイト', desc: '紹介報酬・EC管理' },
        ].map(f => (
          <div key={f.title} style={{
            background: '#0a0a14', border: '1px solid #1a1a2e',
            borderRadius: '16px', padding: '1.25rem', textAlign: 'left'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '0.5rem' }}>{f.icon}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '0.25rem' }}>{f.title}</div>
            <div style={{ fontSize: '12px', color: '#6b6b8a' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', fontSize: '12px', color: '#6b6b8a' }}>
        © 2026 AIMO. Powered by Claude AI
      </div>
    </main>
  )
}
