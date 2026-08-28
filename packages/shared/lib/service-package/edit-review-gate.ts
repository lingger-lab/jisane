/**
 * 파트너 서비스 편집의 재검수 게이트 (감사 docs/11 P2-15)
 *
 * published 패키지를 파트너가 편집하면 재검수 없이 라이브에 반영되던 우회를 차단한다.
 * 편집 저장 시 published → draft('비공개 (검수 대기)')로 회귀시켜:
 * - 공개 카탈로그(queries.ts의 status='published' 필터)에서 즉시 내려가고
 * - 관리자 검수 큐(admin dashboard의 status='draft' 조회)에 다시 잡힌다.
 * draft/archived 편집은 상태를 바꾸지 않는다(정상 경로 불변).
 *
 * CAS: 읽은 status를 update 술어에 포함해, 읽기-쓰기 사이 관리자 전환(publish/archive)과의
 * race에서 조용한 상태 clobber 대신 conflict로 실패한다 (1e85fc3의 CAS 패턴 준용).
 * adminClient를 인자로 받는 DI 구조 — auto-settlement.ts와 같은 방식으로 목 검증 가능.
 */

export interface PackageEditFields {
  name: string
  description: string
  price: number
  is_free: boolean
  deliverables: string[]
  duration: string | null
  value_desc: string
  // 배너 교체도 재검수 대상(이미지가 가장 어뷰징되기 쉬운 필드) — published→draft 회귀에 포함
  banner_url: string | null
}

export type PackageEditOutcome =
  | { ok: true; sentBackToReview: boolean }
  | { ok: false; reason: 'not_found' | 'conflict' | 'db_error' }

export async function applyPackageEdit(
  // DI 경계: SupabaseClient와 테스트 목이 모두 만족해야 해 체인 반환형은 any
  // (auto-settlement.ts와 동일한 구조 — 구조적 타입으로는 빌더 체인을 표현 불가)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: { from: (table: string) => any },
  params: { packageId: string; providerId: string; fields: PackageEditFields }
): Promise<PackageEditOutcome> {
  // 소유권 + 현재 상태 조회 (provider_id 필터가 소유권 검증을 겸한다)
  const { data: pkg, error: selectError } = await client
    .from('service_package')
    .select('id, status')
    .eq('id', params.packageId)
    .eq('provider_id', params.providerId)
    .single()

  // PGRST116(0행)만 not_found — 일시적 DB 오류를 not_found로 위장하지 않는다
  if (selectError && selectError.code !== 'PGRST116') {
    console.error('[edit-review-gate] package select failed:', selectError.message)
    return { ok: false, reason: 'db_error' }
  }
  if (!pkg) return { ok: false, reason: 'not_found' }

  const sendBackToReview = pkg.status === 'published'

  const { data: updated, error } = await client
    .from('service_package')
    .update(
      sendBackToReview
        ? { ...params.fields, status: 'draft' }
        : { ...params.fields }
    )
    .eq('id', params.packageId)
    .eq('provider_id', params.providerId)
    .eq('status', pkg.status) // CAS: 읽은 상태 그대로일 때만 반영
    .select('id')

  if (error) return { ok: false, reason: 'db_error' }
  if (!updated || updated.length === 0) return { ok: false, reason: 'conflict' }

  return { ok: true, sentBackToReview: sendBackToReview }
}
