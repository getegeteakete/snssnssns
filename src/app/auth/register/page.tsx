'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref')
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { toast.error('パスワードは8文字以上で設定してください'); return }
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: name, referred_by: referralCode },
        emailRedirectTo: `${location.origin}/api/auth/callback`
      }
    })

    if (error) {
      toast.error(error.message)
    } else if (data.user) {
      // Update profile with referral code if present
      if (referralCode) {
        await supabase.from('profiles').update({ referred_by: referralCode }).eq('id', data.user.id)
      }
      toast.success('登録確認メールを送信しました。メールをご確認ください。')
      router.push('/auth/login')
    }
    setLoading(false)
  }

  async function handleGoogleRegister() {
    const params = referralCode ? `?ref=${referralCode}` : ''
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/api/auth/callback${params}` }
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="bg-[#0a0a14] border border-[#1a1a2e] rounded-2xl p-8">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="font-display text-2xl font-extrabold">無料登録</h1>
        <span className="badge-cyan">30pt付き</span>
      </div>
      <p className="text-[#6b6b8a] text-sm mb-6">クレジットカード不要。今すぐ体験できます。</p>

      {referralCode && (
        <div className="bg-[rgba(0,229,160,0.06)] border border-[rgba(0,229,160,0.2)] rounded-xl px-4 py-3 mb-4 text-sm text-[#00e5a0]">
          🎁 紹介コード適用中: <strong>{referralCode}</strong>
        </div>
      )}

      <button onClick={handleGoogleRegister} className="w-full flex items-center justify-center gap-3 bg-[#0f0f1e] border border-[#1a1a2e] rounded-xl px-4 py-3 text-sm font-medium hover:border-[#252540] transition-colors mb-4">
        <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
        Googleで登録
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-[#1a1a2e]"/><span className="text-[11px] text-[#6b6b8a]">または</span><div className="flex-1 h-px bg-[#1a1a2e]"/>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#6b6b8a] mb-1.5 tracking-wide">お名前</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="山田 太郎" className="input-field"/>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b6b8a] mb-1.5 tracking-wide">メールアドレス</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field"/>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b6b8a] mb-1.5 tracking-wide">パスワード（8文字以上）</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field"/>
        </div>
        <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-3 text-sm font-semibold disabled:opacity-50">
          {loading ? '登録中...' : '無料で登録する →'}
        </button>
      </form>

      <p className="text-center text-[11px] text-[#6b6b8a] mt-4">
        登録することで<a href="/terms" className="underline hover:text-[#e8e8f4]">利用規約</a>・<a href="/privacy" className="underline hover:text-[#e8e8f4]">プライバシーポリシー</a>に同意したものとします
      </p>
      <p className="text-center text-sm text-[#6b6b8a] mt-3">
        すでにアカウントをお持ちの方は <Link href="/auth/login" className="text-[#00d4ff] hover:underline">ログイン</Link>
      </p>
    </div>
  )
}
