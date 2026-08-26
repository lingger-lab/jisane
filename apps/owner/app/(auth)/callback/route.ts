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

  // owner 레코드 확인/생성 — .maybeSingle()로 "행 없음(정상)"과 "조회 오류"를 구분한다.
  // .single()은 0행도 error로 취급해, DB 순단을 미가입으로 오판하고 기존 회원을 /join으로
  // 오배송할 수 있다(감사 P2-1).
  const { data: existingOwner, error: lookupErr } = await adminClient
    .from('owner')
    .select('id, status')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (lookupErr) {
    console.error('[auth/callback] owner lookup failed:', lookupErr.message)
    return NextResponse.redirect(`${origin}/?error=lookup_failed`)
  }

  // 탈퇴한 계정으로 재로그인 — 재활성 확인 페이지로.
  if (existingOwner && existingOwner.status === 'withdrawn') {
    return NextResponse.redirect(`${origin}/rejoin`)
  }

  if (!existingOwner) {
    // 유형선택(/join)을 거치지 않은 로그인 시도는 자동 가입하지 않고 /join으로 유도한다.
    const isJoin = searchParams.get('join') === '1'
    if (!isJoin) {
      const adminUrl = (process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud').trim().replace(/\/+$/, '')
      return NextResponse.redirect(`${adminUrl}/join?from=owner`)
    }
    // Kakao는 이메일 제공 동의가 선택일 수 있다 — email 없이 insert하면 NOT NULL 위반으로
    // 매 로그인마다 같은 실패를 반복하는 dead-end가 된다(감사 docs/11 P3-72).
    // 일반 profile_create가 아닌 구분된 에러로 원인을 표면화한다.
    if (!user.email) {
      console.warn(`[auth/callback] ${provider} 계정에 이메일 없음 — 가입 불가 (auth_user_id: ${user.id})`)
      return NextResponse.redirect(`${origin}/?error=email_required`)
    }
    const { error: insertErr } = await adminClient.from('owner').insert({
      auth_user_id: user.id,
      provider,
      email: user.email,
    })
    if (insertErr) {
      console.error('[auth/callback] owner insert failed:', insertErr.message)
      return NextResponse.redirect(`${origin}/?error=profile_create`)
    }
  }

  return NextResponse.redirect(`${origin}/`)
}
