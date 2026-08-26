import { adminClient } from '../supabase/admin'

/**
 * 회원 탈퇴(soft-delete) 공용 헬퍼 — 본인/관리자 강제 양쪽에서 재사용.
 *
 * 하드삭제는 deal/matching FK RESTRICT + 전자상거래법 5년 보존의무로 불가하므로,
 * 해당 역할 행만 status='withdrawn'으로 전환하고 개인식별정보를 익명화한다.
 * 거래·정산 기록(FK로 id만 참조)은 보존된다. 익명화는 비가역 — 재활성 시 재입력.
 */

export type WithdrawnBy = 'self' | 'admin'
export type MemberRole = 'owner' | 'expert' | 'provider'

const WITHDRAWN_NAME = '(탈퇴회원)'

/** 익명화 이메일 — owner/expert의 email NOT NULL 제약을 지키며 row id로 유일성 보장. */
export function anonymizedEmail(id: string): string {
  return `withdrawn+${id}@deleted.local`
}

// ── 순수 페이로드 빌더(단위테스트 대상) — now()를 주입받아 결정성 확보 ──

export function ownerWithdrawalPayload(id: string, by: WithdrawnBy, at: string) {
  return {
    status: 'withdrawn' as const,
    withdrawn_at: at,
    withdrawn_by: by,
    email: anonymizedEmail(id),
    company: WITHDRAWN_NAME,
    ceo_name: null,
    region: null,
    industry: null,
    contact: null,
  }
}

export function expertWithdrawalPayload(id: string, by: WithdrawnBy, at: string) {
  return {
    status: 'withdrawn' as const,
    withdrawn_at: at,
    withdrawn_by: by,
    email: anonymizedEmail(id),
    name: WITHDRAWN_NAME,
    real_name: null,
    contact: null,
  }
}

export function providerWithdrawalPayload(id: string, by: WithdrawnBy, at: string) {
  return {
    status: 'withdrawn' as const,
    withdrawn_at: at,
    withdrawn_by: by,
    email: null, // provider.email은 nullable
    name: WITHDRAWN_NAME,
    contact: null,
    website: null,
    description: null,
  }
}

// ── 실행 함수(익명화 update + 부수효과) ──

export async function withdrawOwner(id: string, by: WithdrawnBy): Promise<{ error?: string }> {
  const at = new Date().toISOString()
  const { error } = await adminClient.from('owner').update(ownerWithdrawalPayload(id, by, at)).eq('id', id)
  if (error) return { error: error.message }

  // 파생 정리(감사 P1-5) — 탈퇴 owner의 열린 파이프라인을 닫아 매칭 대상·초빙 대기에서 제거.
  const { error: reqErr } = await adminClient.from('request').update({ status: 'closed' }).eq('owner_id', id).eq('status', 'open')
  if (reqErr) console.error('[withdrawal] open request 정리 실패:', reqErr.message)
  const { error: invErr } = await adminClient.from('invitation').update({ status: 'declined' }).eq('owner_id', id).eq('status', 'invited')
  if (invErr) console.error('[withdrawal] invited invitation 정리 실패:', invErr.message)

  // 구독 정리(subscription 다형참조)는 구독 기능이 코드에 연동되는 시점에 추가한다
  // — 현재 subscription 테이블은 앱 코드 미사용·미타입이라 방어 코드를 넣지 않는다(스코프 보류).
  return {}
}

export async function withdrawExpert(id: string, by: WithdrawnBy): Promise<{ error?: string }> {
  const at = new Date().toISOString()
  const { error } = await adminClient.from('expert').update(expertWithdrawalPayload(id, by, at)).eq('id', id)
  if (error) return { error: error.message }
  // 매칭 후보 이중 방어 — status='withdrawn' 필터에 더해 전문분야 매핑도 제거.
  const { error: catErr } = await adminClient.from('expert_category').delete().eq('expert_id', id)
  if (catErr) console.error('[withdrawal] expert_category 삭제 실패:', catErr.message)

  // 파생 정리(감사 P1-5) — 잔존 관심표현 삭제(관리자 후보 병합 노출 차단) + 대기 초빙 거절 처리.
  const { error: intErr } = await adminClient.from('expert_interest').delete().eq('expert_id', id)
  if (intErr) console.error('[withdrawal] expert_interest 삭제 실패:', intErr.message)
  const { error: invErr } = await adminClient.from('invitation').update({ status: 'declined' }).eq('expert_id', id).eq('status', 'invited')
  if (invErr) console.error('[withdrawal] invited invitation 정리 실패:', invErr.message)
  return {}
}

export async function withdrawProvider(id: string, by: WithdrawnBy): Promise<{ error?: string }> {
  const at = new Date().toISOString()
  const { error } = await adminClient.from('provider').update(providerWithdrawalPayload(id, by, at)).eq('id', id)
  if (error) return { error: error.message }
  // 공개 서비스는 노출 차단 — published 패키지를 archived로.
  const { error: pkgErr } = await adminClient
    .from('service_package')
    .update({ status: 'archived' })
    .eq('provider_id', id)
    .eq('status', 'published')
  if (pkgErr) console.error('[withdrawal] service_package archive 실패:', pkgErr.message)
  return {}
}

export async function withdrawMember(role: MemberRole, id: string, by: WithdrawnBy): Promise<{ error?: string }> {
  if (role === 'owner') return withdrawOwner(id, by)
  if (role === 'expert') return withdrawExpert(id, by)
  return withdrawProvider(id, by)
}
