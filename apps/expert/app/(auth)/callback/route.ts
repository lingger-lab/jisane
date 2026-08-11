import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/?error=exchange_failed`)
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.redirect(`${origin}/?error=no_user`)
  }

  const provider = (user.app_metadata.provider as string) || 'google'

  // expert 레코드 확인/생성
  const { data: existingExpert } = await adminClient
    .from('expert')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!existingExpert) {
    // Kakao는 이메일 제공 동의가 선택일 수 있다 — email 없이 insert하면 NOT NULL 위반으로
    // 매 로그인마다 같은 실패를 반복하는 dead-end가 된다(감사 docs/11 P3-34).
    // 일반 profile_create가 아닌 구분된 에러로 원인을 표면화한다.
    if (!user.email) {
      console.warn(`[auth/callback] ${provider} 계정에 이메일 없음 — 가입 불가 (auth_user_id: ${user.id})`)
      return NextResponse.redirect(`${origin}/?error=email_required`)
    }
    const { error: insertErr } = await adminClient.from('expert').insert({
      auth_user_id: user.id,
      provider,
      email: user.email,
    })
    if (insertErr) {
      console.error('[auth/callback] expert insert failed:', insertErr.message)
      return NextResponse.redirect(`${origin}/?error=profile_create`)
    }
    return NextResponse.redirect(`${origin}/register`)
  }

  return NextResponse.redirect(`${origin}/`)
}
