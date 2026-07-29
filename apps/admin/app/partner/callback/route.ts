import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'

/**
 * 파트너 전용 OAuth callback — 기존 (auth)/callback(ADMIN_EMAILS 검사)과 별도 경로.
 * Supabase 대시보드 Redirect URLs에 {SITE_URL}/partner/callback 등록 필요.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/partner?error=no_code`)
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/partner?error=exchange_failed`)
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.redirect(`${origin}/partner?error=no_user`)
  }

  const provider = await getProviderByAuthUser(user.id)
  if (!provider) {
    return NextResponse.redirect(`${origin}/partner/apply`)
  }

  // 상태별 안내는 dashboard 레이아웃 가드가 담당
  return NextResponse.redirect(`${origin}/partner/dashboard`)
}
