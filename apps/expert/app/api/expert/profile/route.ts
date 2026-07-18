import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const { data: expert } = await adminClient
    .from('expert')
    .select('name, field, career_years, hourly_rate, contact, email, grade, created_at')
    .eq('auth_user_id', user.id)
    .single()

  if (!expert) {
    return NextResponse.json({ error: '전문가 정보 없음' }, { status: 404 })
  }

  return NextResponse.json({ expert })
}
