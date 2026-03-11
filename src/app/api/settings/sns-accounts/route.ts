import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('sns_accounts')
    .select('id, platform, account_name, followers_count, is_active, created_at')
    .eq('user_id', user.id)

  return NextResponse.json(data || [])
}
