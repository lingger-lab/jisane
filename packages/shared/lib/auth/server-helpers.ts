import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '../supabase/server'
import { adminClient } from '../supabase/admin'
import type { DealWithOwnership } from '../query-types'

/**
 * 인증된 사용자의 auth_user_id를 반환합니다.
 * 미인증 시 루트('/')로 리다이렉트합니다.
 */
export async function getAuthUserId(): Promise<string> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }
  return user.id
}

/**
 * 인증 사용자 → expert 행 해석 — 단일 소스 (감사 docs/11 P3-69, 6곳 중복 제거).
 * 실패 정책(redirect vs 에러 반환)은 호출부 소관이므로 여기서는 null만 반환합니다.
 * 미인증이면 expert 조회 없이 즉시 { user: null, expert: null }을 반환합니다.
 * @param columns expert 테이블에서 select할 컬럼 (기본 'id')
 */
export async function resolveExpertFromAuth<T = { id: string }>(
  columns = 'id'
): Promise<{ user: User | null; expert: T | null }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { user: null, expert: null }

  // .maybeSingle(): "행 없음(정상)"과 "조회 오류"를 구분 — .single()의 0행-에러 오판 방지(감사 P2-2).
  const { data: expert } = await adminClient
    .from('expert')
    .select(columns)
    .eq('auth_user_id', user.id)
    .maybeSingle()

  return { user, expert: (expert as T | null) ?? null }
}

/**
 * 활성 expert 게이트 — 뮤테이션 액션(관심표현·매칭수락·초빙수락) 진입부용.
 * status 게이트가 콜백에만 있어 세션 유지 중인 withdrawn/suspended/waiting 회원이
 * 핵심 액션을 수행하던 결함(Fable5 감사 P1-1)을 액션 레벨에서 차단한다.
 */
export async function requireActiveExpert(): Promise<
  { ok: true; expertId: string } | { ok: false; error: string }
> {
  const { user, expert } = await resolveExpertFromAuth<{ id: string; status: string }>('id, status')
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }
  if (!expert) return { ok: false, error: '시니어지식인 계정이 없습니다.' }
  if (expert.status !== 'active') {
    return { ok: false, error: '현재 이용할 수 없는 계정입니다. 관리자에게 문의해주세요.' }
  }
  return { ok: true, expertId: expert.id }
}

/**
 * 활성 owner 게이트 + insert-if-missing 통합 헬퍼 — 회원전환(다른 역할→기업)·의뢰/주문 생성에서
 * 공용 사용(감사 리팩토링 1). owner 행이 없으면 생성하고, 있으면 active만 통과시킨다.
 * email 가드(카카오 미동의)·UNIQUE 경합 재조회를 한 곳에 두어 산재하던 구현 편차를 제거.
 */
export async function resolveOrCreateOwner(): Promise<
  { ok: true; ownerId: string } | { ok: false; error: string }
> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const { data: owner, error: lookupErr } = await adminClient
    .from('owner')
    .select('id, status')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (lookupErr) return { ok: false, error: '계정 조회에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  if (owner) {
    if (owner.status !== 'active') return { ok: false, error: '현재 이용할 수 없는 계정입니다. 관리자에게 문의해주세요.' }
    return { ok: true, ownerId: owner.id }
  }

  if (!user.email) return { ok: false, error: '이메일 제공에 동의한 계정으로 다시 로그인해주세요.' }
  const authProvider = (user.app_metadata?.provider as string) || 'google'
  const { data: created, error: insErr } = await adminClient
    .from('owner')
    .insert({ auth_user_id: user.id, provider: authProvider === 'kakao' ? 'kakao' : 'google', email: user.email })
    .select('id')
    .single()
  if (insErr || !created) {
    const { data: existing } = await adminClient.from('owner').select('id').eq('auth_user_id', user.id).single()
    if (!existing) return { ok: false, error: '계정 생성에 실패했습니다. 다시 시도해주세요.' }
    return { ok: true, ownerId: existing.id }
  }
  return { ok: true, ownerId: created.id }
}

/**
 * Admin 권한을 검증합니다.
 * ADMIN_EMAILS 환경변수에 포함된 이메일만 허용합니다.
 */
export async function verifyAdmin(): Promise<{ email: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    throw new Error('Unauthorized')
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())
  if (!adminEmails.includes(user.email.toLowerCase())) {
    throw new Error('Forbidden')
  }

  return { email: user.email }
}

/**
 * Deal 소유권을 검증합니다.
 * deal → request → owner → auth_user_id 체인으로 확인합니다.
 */
export async function verifyDealOwnership(dealId: string, authUserId: string) {
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, status, request_id, expert_id, request:request!inner(id, owner_id, owner:owner!inner(auth_user_id))')
    .eq('id', dealId)
    .returns<DealWithOwnership[]>()
    .single()

  if (!deal) {
    return { error: '거래 정보를 찾을 수 없습니다.' as const }
  }

  const request = deal.request
  if (request.owner.auth_user_id !== authUserId) {
    return { error: '접근 권한이 없습니다.' as const }
  }

  return { deal, requestId: request.id, ownerId: request.owner_id }
}
