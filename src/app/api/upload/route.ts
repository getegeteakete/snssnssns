import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: '5MB以下のファイルを選択してください' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) return NextResponse.json({ error: 'JPG/PNG/GIF/WEBPのみ対応しています' }, { status: 400 })

    const ext = file.name.split('.').pop()
    const filename = `${user.id}/${Date.now()}.${ext}`
    const admin = createAdminClient()

    // バケット作成（存在しない場合）
    const { data: buckets } = await admin.storage.listBuckets()
    if (!buckets?.find(b => b.name === 'post-images')) {
      await admin.storage.createBucket('post-images', { public: true, fileSizeLimit: 5242880 })
    }

    const { error } = await admin.storage.from('post-images').upload(filename, file, { contentType: file.type })
    if (error) throw error

    const { data: { publicUrl } } = admin.storage.from('post-images').getPublicUrl(filename)
    return NextResponse.json({ url: publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: 'アップロードに失敗しました: ' + e.message }, { status: 500 })
  }
}
