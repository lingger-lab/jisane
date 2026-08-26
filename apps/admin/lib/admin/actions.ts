'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { findCandidates } from '@jisane/shared/matching-algo'
import { calculateAiRating } from '@jisane/shared/review-algo'
import { recalcExpertScores, batchRecalcExpertScores } from '@jisane/shared/expert-scoring'
import { autoReleaseSettlements } from '@jisane/shared/automation/auto-settlement'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { withdrawMember, type MemberRole } from '@jisane/shared/member/withdrawal'
import type { ExpertRow } from '@jisane/shared/types'
import type { InterestWithExpert } from '@jisane/shared/query-types'
import { getCachedCategories, type CategoryRow } from '@jisane/shared/categories'

export async function getCandidatesForRequest(requestId: string) {
  await verifyAdmin()

  // 기존 AI 후보가 있는지 확인
  const { data: existingCandidates } = await adminClient
    .from('matching_candidate')
    .select('id, expert_id, rank, score, score_detail, status, auto_assign_at, created_at')
    .eq('request_id', requestId)
    .order('rank', { ascending: true })

  // AI 후보가 이미 있으면 그 데이터를 반환
  if (existingCandidates && existingCandidates.length > 0) {
    const expertIds = existingCandidates.map((c) => c.expert_id)
    const { data: expertData } = await adminClient
      .from('expert')
      .select('id, name, field, career_years')
      .in('id', expertIds)

    const expertMap = new Map((expertData || []).map((p) => [p.id, p]))

    const candidates = existingCandidates.map((c) => {
      const p = expertMap.get(c.expert_id)
      return {
        expert_id: c.expert_id,
        name: p?.name || null,
        field: p?.field || null,
        career_years: p?.career_years || null,
        score: Number(c.score),
        score_detail: c.score_detail as Record<string, number> | null,
        rank: c.rank,
        status: c.status,
        auto_assign_at: c.auto_assign_at,
        interested: false,
        interest_note: null as string | null,
      }
    })

    return { candidates, hasAiCandidates: true, autoAssignAt: existingCandidates[0]?.auto_assign_at }
  }

  // AI 후보가 없으면 알고리즘으로 생성
  const [{ data: req }, { data: interests }] = await Promise.all([
    adminClient
      .from('request')
      .select('id, title, detail, req_type, category_id')
      .eq('id', requestId)
      .single(),
    adminClient
      .from('expert_interest')
      .select('expert_id, note, expert:expert!inner(id, name, field, career_years)')
      .eq('request_id', requestId)
      .returns<InterestWithExpert[]>(),
  ])

  if (!req) return { candidates: [], hasAiCandidates: false }

  const [{ data: experts }, categories, { data: expertCategories }] = await Promise.all([
    adminClient.from('expert').select('*').eq('status', 'active').not('auth_user_id', 'is', null),
    getCachedCategories(adminClient),
    adminClient.from('expert_category').select('expert_id, category_id'),
  ])

  // 관심 표현 목록
  const interestList = (interests || []).map((i) => ({ expert_id: i.expert_id }))

  const candidates = findCandidates(
    { title: req.title, detail: req.detail, req_type: req.req_type, category_id: req.category_id },
    (experts || []) as ExpertRow[],
    {
      categories,
      expertCategories: expertCategories || [],
      interests: interestList,
      expertStats: [],
    }
  )

  // 관심 표현 시니어지식인 매핑
  const interestMap = new Map<string, string | null>()
  for (const i of (interests || [])) {
    interestMap.set(i.expert_id, i.note)
  }

  const candidateIds = new Set(candidates.map((c) => c.expert.id))
  const merged = candidates.map((c, idx) => ({
    expert_id: c.expert.id,
    name: c.expert.name,
    field: c.expert.field,
    career_years: c.expert.career_years,
    score: c.score,
    score_detail: c.scoreDetail as Record<string, number> | null,
    rank: idx + 1,
    status: 'pending',
    auto_assign_at: null as string | null,
    interested: interestMap.has(c.expert.id),
    interest_note: interestMap.get(c.expert.id) || null,
  }))

  // 관심 표현했지만 알고리즘 후보가 아닌 시니어지식인 추가
  for (const i of (interests || [])) {
    if (!candidateIds.has(i.expert_id)) {
      merged.push({
        expert_id: i.expert_id,
        name: i.expert.name,
        field: i.expert.field,
        career_years: i.expert.career_years,
        score: 0,
        score_detail: null,
        rank: merged.length + 1,
        status: 'pending',
        auto_assign_at: null,
        interested: true,
        interest_note: i.note,
      })
    }
  }

  // 관심 표현 시니어지식인을 상단으로 정렬
  merged.sort((a, b) => {
    if (a.interested && !b.interested) return -1
    if (!a.interested && b.interested) return 1
    return b.score - a.score
  })

  return { candidates: merged, hasAiCandidates: false }
}

/** AI 후보 3명을 matching_candidate 테이블에 저장 */
export async function generateAiCandidates(requestId: string): Promise<{ error?: string }> {
  await verifyAdmin()

  // 이미 후보가 있는지 확인
  const { data: existing } = await adminClient
    .from('matching_candidate')
    .select('id')
    .eq('request_id', requestId)
    .limit(1)

  if (existing && existing.length > 0) return { error: '이미 AI 후보가 생성되었습니다.' }

  const { data: req } = await adminClient
    .from('request')
    .select('id, title, detail, req_type, category_id, status')
    .eq('id', requestId)
    .single()

  if (!req) return { error: '의뢰를 찾을 수 없습니다.' }
  if (req.status !== 'open') return { error: '매칭 대기 상태가 아닙니다.' }

  const [{ data: experts }, categories, { data: expertCategories }, { data: interests }] = await Promise.all([
    adminClient.from('expert').select('*').eq('status', 'active').not('auth_user_id', 'is', null),
    getCachedCategories(adminClient),
    adminClient.from('expert_category').select('expert_id, category_id'),
    adminClient.from('expert_interest').select('expert_id').eq('request_id', requestId),
  ])

  const candidates = findCandidates(
    { title: req.title, detail: req.detail, req_type: req.req_type, category_id: req.category_id },
    (experts || []) as ExpertRow[],
    {
      categories,
      expertCategories: expertCategories || [],
      interests: interests || [],
      expertStats: [],
    },
    3
  )

  if (candidates.length === 0) return { error: '적합한 후보가 없습니다.' }

  const autoAssignAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const rows = candidates.map((c, idx) => ({
    request_id: requestId,
    expert_id: c.expert.id,
    rank: idx + 1,
    score: c.score,
    score_detail: c.scoreDetail,
    status: 'pending',
    auto_assign_at: autoAssignAt,
  }))

  const { error: insertError } = await adminClient
    .from('matching_candidate')
    .insert(rows)

  if (insertError) return { error: insertError.message }

  revalidatePath('/dashboard')
  return {}
}

/** AI 후보 중 1명을 선택하여 매칭 생성 */
export async function selectCandidate(
  requestId: string,
  expertId: string
): Promise<{ error?: string }> {
  await verifyAdmin()

  const { data: req } = await adminClient
    .from('request')
    .select('id, status')
    .eq('id', requestId)
    .single()

  if (!req) return { error: '의뢰를 찾을 수 없습니다.' }
  if (req.status !== 'open') return { error: '이미 매칭 진행 중인 의뢰입니다.' }

  // 후보 스냅샷 이후 상태가 바뀌었을 수 있으므로 배정 직전 재검증(감사 P1-2/P1-3):
  // 비활성·유령(auth_user_id null 시드) expert에게 매칭이 생성되는 것을 차단.
  const { data: cand } = await adminClient
    .from('expert')
    .select('status, auth_user_id')
    .eq('id', expertId)
    .single()
  if (!cand || cand.status !== 'active' || !cand.auth_user_id) {
    return { error: '선택할 수 없는 시니어지식인입니다(비활성 또는 계정 미연결).' }
  }

  // 경합 가드(감사 P1-1) — request를 open→matching으로 CAS 선점. 동시 선택/이중클릭에서
  // 한 번만 통과해 한 의뢰에 매칭·deal이 중복 생성되는 것을 차단한다.
  const { data: claimed } = await adminClient
    .from('request')
    .update({ status: 'matching' })
    .eq('id', requestId)
    .eq('status', 'open')
    .select('id')
  if (!claimed || claimed.length === 0) return { error: '이미 매칭 진행 중인 의뢰입니다.' }

  // 선택된 후보를 selected로, 나머지를 skipped로
  await adminClient
    .from('matching_candidate')
    .update({ status: 'skipped' })
    .eq('request_id', requestId)
    .neq('expert_id', expertId)

  await adminClient
    .from('matching_candidate')
    .update({ status: 'selected' })
    .eq('request_id', requestId)
    .eq('expert_id', expertId)

  // matching 생성
  const { error: matchError } = await adminClient
    .from('matching')
    .insert({
      request_id: requestId,
      expert_id: expertId,
      status: 'proposed',
    })

  if (matchError) {
    // 보상: 선점했던 request를 open으로 되돌림(재시도 가능 상태 복원).
    await adminClient.from('request').update({ status: 'open' }).eq('id', requestId)
    return { error: matchError.message }
  }

  revalidatePath('/dashboard')
  return {}
}

/** 24시간 초과 시 1순위 자동 배정 체크 (배치 최적화) */
export async function autoAssignOverdue(): Promise<number> {
  await verifyAdmin()

  const { data: overdue } = await adminClient
    .from('matching_candidate')
    .select('id, request_id, expert_id, rank')
    .eq('status', 'pending')
    .eq('rank', 1)
    .lt('auto_assign_at', new Date().toISOString())

  if (!overdue || overdue.length === 0) return 0

  // 1. 관련 request 상태 일괄 조회
  const requestIds = [...new Set(overdue.map((c) => c.request_id))]
  const { data: requests } = await adminClient
    .from('request')
    .select('id, status')
    .in('id', requestIds)

  const openRequestIds = new Set(
    (requests || []).filter((r) => r.status === 'open').map((r) => r.id)
  )

  // open 상태인 의뢰의 후보만 필터
  const openEligible = overdue.filter((c) => openRequestIds.has(c.request_id))
  if (openEligible.length === 0) return 0

  // 비활성·유령(auth_user_id null) expert 후보 배제 — 로그인 불가 유령에게 자동배정되어
  // request가 영구 고착되는 것을 차단(감사 P1-2/P1-3).
  const candidateExpertIds = [...new Set(openEligible.map((c) => c.expert_id))]
  const { data: activeExperts } = await adminClient
    .from('expert')
    .select('id')
    .eq('status', 'active')
    .not('auth_user_id', 'is', null)
    .in('id', candidateExpertIds)
  const activeExpertSet = new Set((activeExperts || []).map((e) => e.id))
  const eligible = openEligible.filter((c) => activeExpertSet.has(c.expert_id))
  if (eligible.length === 0) return 0

  const eligibleIds = eligible.map((c) => c.id)
  const eligibleRequestIds = [...new Set(eligible.map((c) => c.request_id))]

  // 2. 선택된 후보 일괄 selected (낙관적 잠금: pending 가드로 중복 방지)
  const { data: actuallySelected, error: selectError } = await adminClient
    .from('matching_candidate')
    .update({ status: 'selected' })
    .in('id', eligibleIds)
    .eq('status', 'pending')
    .select('id, request_id, expert_id')

  if (selectError) {
    console.error('[autoAssignOverdue] candidate select failed:', selectError.message)
    return 0
  }

  if (!actuallySelected || actuallySelected.length === 0) {
    console.info('[autoAssignOverdue] all candidates were already processed by another invocation')
    return 0
  }

  const selectedRequestIds = [...new Set(actuallySelected.map((c: { request_id: string }) => c.request_id))]

  // 3. 같은 request의 나머지 후보 일괄 skipped
  const { error: skipError } = await adminClient
    .from('matching_candidate')
    .update({ status: 'skipped' })
    .in('request_id', selectedRequestIds)
    .eq('status', 'pending')

  if (skipError) {
    console.warn('[autoAssignOverdue] candidate skip failed:', skipError.message)
  }

  // 4. matching 일괄 insert (실제 선택된 후보만)
  const matchingRows = actuallySelected.map((c: { request_id: string; expert_id: string }) => ({
    request_id: c.request_id,
    expert_id: c.expert_id,
    status: 'proposed',
  }))
  const { error: matchInsertError } = await adminClient.from('matching').insert(matchingRows)

  if (matchInsertError) {
    console.error('[autoAssignOverdue] matching insert failed:', matchInsertError.message)
    // 보상 롤백(감사 P1-5) — 선점했던 후보를 pending으로 되돌려 다음 크론이 재시도하게 한다.
    // 롤백을 안 하면 후보가 selected로 고착되고 matching은 없어 자동배정이 영구 중단된다.
    const { error: rbError } = await adminClient
      .from('matching_candidate')
      .update({ status: 'pending' })
      .in('id', actuallySelected.map((c: { id: string }) => c.id))
      .eq('status', 'selected')
    if (rbError) console.error('[autoAssignOverdue] CRITICAL 후보 롤백 실패(수동 보정 필요):', rbError.message)
    return 0
  }

  // 5. request 상태 일괄 변경 (open 가드: 다른 경로로 이미 매칭된 건 제외)
  const { error: reqUpdateError } = await adminClient
    .from('request')
    .update({ status: 'matching' })
    .in('id', selectedRequestIds)
    .eq('status', 'open')

  if (reqUpdateError) {
    console.warn('[autoAssignOverdue] request status update failed:', reqUpdateError.message)
  }

  console.info(`[autoAssignOverdue] assigned ${actuallySelected.length} overdue candidates`)
  revalidatePath('/dashboard')
  return actuallySelected.length
}

export async function createMatching(
  requestId: string,
  expertId: string
): Promise<{ error?: string }> {
  await verifyAdmin()

  // 의뢰 상태 확인
  const { data: req } = await adminClient
    .from('request')
    .select('id, status')
    .eq('id', requestId)
    .single()

  if (!req) return { error: '의뢰를 찾을 수 없습니다.' }
  if (req.status !== 'open') return { error: '이미 매칭 진행 중인 의뢰입니다.' }

  // 시니어지식인 확인
  const { data: expert } = await adminClient
    .from('expert')
    .select('id, status, auth_user_id')
    .eq('id', expertId)
    .single()

  if (!expert) return { error: '시니어지식인을 찾을 수 없습니다.' }
  if (expert.status !== 'active') return { error: '비활성 시니어지식인입니다.' }
  if (!expert.auth_user_id) return { error: '계정이 연결되지 않은 시니어지식인입니다.' }

  // 경합 가드(감사 P1-1) — request open→matching CAS 선점 후 매칭 생성.
  const { data: claimed } = await adminClient
    .from('request')
    .update({ status: 'matching' })
    .eq('id', requestId)
    .eq('status', 'open')
    .select('id')
  if (!claimed || claimed.length === 0) return { error: '이미 매칭 진행 중인 의뢰입니다.' }

  // matching 생성
  const { error: matchError } = await adminClient
    .from('matching')
    .insert({
      request_id: requestId,
      expert_id: expertId,
      status: 'proposed',
    })

  if (matchError) {
    await adminClient.from('request').update({ status: 'open' }).eq('id', requestId)
    return { error: matchError.message }
  }

  revalidatePath('/dashboard')
  return {}
}

/** 파트너(provider) 상태 변경 — 승인/반려/중지/재활성 */
export async function updateProviderStatus(
  providerId: string,
  status: 'active' | 'rejected' | 'suspended'
): Promise<{ error?: string }> {
  await verifyAdmin()

  // 탈퇴(withdrawn) 행은 이 경로로 되살리지 않는다(감사 P2-4) — 정식 재활성은 reactivateMemberByAdmin.
  const { error } = await adminClient
    .from('provider')
    .update({ status })
    .eq('id', providerId)
    .neq('status', 'withdrawn')

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

/** 기업회원(owner) 상태 변경 — 관리자 전용 (owner_status: active/inactive) */
export async function updateOwnerStatus(
  ownerId: string,
  status: 'active' | 'inactive'
): Promise<{ error?: string }> {
  await verifyAdmin()

  const { error } = await adminClient
    .from('owner')
    .update({ status })
    .eq('id', ownerId)
    .neq('status', 'withdrawn')

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

/** 시니어지식인(expert) 상태 변경 — 관리자 전용 (expert_status: active/waiting/suspended) */
export async function updateExpertStatus(
  expertId: string,
  status: 'active' | 'waiting' | 'suspended'
): Promise<{ error?: string }> {
  await verifyAdmin()

  // 탈퇴 행은 이 경로로 되살리지 않는다(감사 P2-4).
  const { error } = await adminClient
    .from('expert')
    .update({ status })
    .eq('id', expertId)
    .neq('status', 'withdrawn')

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

/** 파트너 서비스 검수 — draft ↔ published / archived 전환 */
export async function updatePackageStatus(
  packageId: string,
  status: 'draft' | 'published' | 'archived'
): Promise<{ error?: string }> {
  await verifyAdmin()

  const { error } = await adminClient
    .from('service_package')
    .update({ status })
    .eq('id', packageId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

// ── 회원 유형 관리 / 강제 탈퇴 (Phase 1) ──

/** role → members 라우트 세그먼트(provider는 /members/partner). */
const MEMBER_ROUTE: Record<MemberRole, string> = { owner: 'owner', expert: 'expert', provider: 'partner' }

function revalidateMember(role: MemberRole, id: string) {
  revalidatePath('/dashboard')
  revalidatePath(`/members/${MEMBER_ROUTE[role]}`)
  revalidatePath(`/members/${MEMBER_ROUTE[role]}/${id}`)
}

/** 역할별 진행 중 작업 존재 여부 — 강제탈퇴 가드(본인 탈퇴와 동일 기준). */
async function hasInProgressWork(role: MemberRole, id: string): Promise<boolean> {
  if (role === 'owner') {
    const { data: reqs } = await adminClient.from('request').select('id').eq('owner_id', id)
    const reqIds = (reqs ?? []).map((r) => r.id)
    if (reqIds.length === 0) return false
    const { count } = await adminClient
      .from('deal')
      .select('id', { count: 'exact', head: true })
      .in('request_id', reqIds)
      .in('status', ['quoted', 'working'])
    return (count ?? 0) > 0
  }
  if (role === 'expert') {
    const [{ count: m }, { count: d }] = await Promise.all([
      adminClient.from('matching').select('id', { count: 'exact', head: true }).eq('expert_id', id).in('status', ['proposed', 'accepted']),
      adminClient.from('deal').select('id', { count: 'exact', head: true }).eq('expert_id', id).in('status', ['quoted', 'working']),
    ])
    return (m ?? 0) > 0 || (d ?? 0) > 0
  }
  const { count } = await adminClient
    .from('service_order')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', id)
    .in('status', ['paid', 'processing'])
  return (count ?? 0) > 0
}

/** 관리자 강제 탈퇴 — soft-delete + 개인정보 익명화(비가역). 거래·정산 기록은 보존. */
export async function withdrawMemberByAdmin(role: MemberRole, id: string): Promise<{ error?: string }> {
  await verifyAdmin()
  // 진행 중 거래·주문이 있으면 차단(감사 P1-5, 본인 탈퇴 가드와 동일 기준).
  if (await hasInProgressWork(role, id)) {
    return { error: '진행 중인 거래·주문이 있어 탈퇴 처리할 수 없습니다. 완료 후 다시 시도해주세요.' }
  }
  const result = await withdrawMember(role, id, 'admin')
  if (result.error) return result
  revalidateMember(role, id)
  return {}
}

/**
 * 관리자 역할 부여 — 잘못된 유형으로 가입한 계정에 올바른 역할 행을 생성(insert-if-missing).
 * 같은 auth 계정의 기존 역할 행에서 email을 복사. 이미 있으면 멱등(withdrawn이면 재활성).
 * provider는 name·type이 NOT NULL(빈 shell 불가) + 승인제라 이 액션 대상이 아님 — /partner/apply 경유.
 */
export async function grantRoleByAdmin(
  authUserId: string,
  targetRole: 'owner' | 'expert'
): Promise<{ error?: string }> {
  await verifyAdmin()

  const { data: existing } = await adminClient
    .from(targetRole)
    .select('id, status')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  // 실제 email은 auth.users에서 취득 — 기존 역할 행이 탈퇴 익명화 상태면 그 email을
  // 복사할 수 없으므로(감사 P2-2) auth 원본을 사용.
  const { data: authRes } = await adminClient.auth.admin.getUserById(authUserId)
  const email = authRes?.user?.email ?? null

  if (existing) {
    if (existing.status === 'withdrawn') {
      await adminClient
        .from(targetRole)
        .update({ status: 'active', withdrawn_at: null, withdrawn_by: null, ...(email ? { email } : {}) })
        .eq('id', existing.id)
    }
    revalidateMember(targetRole, existing.id)
    return {}
  }

  if (!email) return { error: '이 계정의 이메일을 찾을 수 없어 역할을 부여할 수 없습니다.' }

  const { error } =
    targetRole === 'owner'
      ? await adminClient.from('owner').insert({ auth_user_id: authUserId, email })
      : await adminClient.from('expert').insert({ auth_user_id: authUserId, email })
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath(`/members/${MEMBER_ROUTE[targetRole]}`)
  return {}
}

/** 회원 행 id → auth_user_id (역할별 조회). */
async function memberAuthUserId(role: MemberRole, id: string): Promise<string | null> {
  const { data } =
    role === 'owner'
      ? await adminClient.from('owner').select('auth_user_id').eq('id', id).maybeSingle()
      : role === 'expert'
        ? await adminClient.from('expert').select('auth_user_id').eq('id', id).maybeSingle()
        : await adminClient.from('provider').select('auth_user_id').eq('id', id).maybeSingle()
  return data?.auth_user_id ?? null
}

/**
 * 관리자 재활성 — 강제탈퇴 오조작 되돌리기용. 익명화된 email은 auth.users의 실제 email로
 * 복원(감사 P1-4). provider는 승인 재심사를 위해 pending으로(감사 P2-5), 그 외 active.
 * 나머지 프로필 정보는 복원하지 않는다(회원이 재입력).
 */
export async function reactivateMemberByAdmin(role: MemberRole, id: string): Promise<{ error?: string }> {
  await verifyAdmin()

  const authUserId = await memberAuthUserId(role, id)
  let email: string | null = null
  if (authUserId) {
    const { data } = await adminClient.auth.admin.getUserById(authUserId)
    email = data?.user?.email ?? null
  }
  const emailPatch = email ? { email } : {}
  const base = { withdrawn_at: null, withdrawn_by: null, ...emailPatch }

  const { error } =
    role === 'owner'
      ? await adminClient.from('owner').update({ status: 'active', ...base }).eq('id', id)
      : role === 'expert'
        ? await adminClient.from('expert').update({ status: 'active', ...base }).eq('id', id)
        : await adminClient.from('provider').update({ status: 'pending', ...base }).eq('id', id)
  if (error) return { error: error.message }

  revalidateMember(role, id)
  return {}
}

/** deal이 quoted면 working으로 CAS 전이(입금 확인=작업 시작). 이미 진행됐으면 멱등(no-op). */
async function startWorkIfQuoted(dealId: string): Promise<string | undefined> {
  const { error } = await adminClient
    .from('deal')
    .update({ status: 'working' })
    .eq('id', dealId)
    .eq('status', 'quoted')
  return error?.message
}

/**
 * 수동 입금 확인 — 작업비 입금(계좌이체)을 관리자가 확인하고 pending → deposited 전환 +
 * **deal quoted → working(작업 시작)**. 근시 무료 운영(docs/16 §0)에서 지사네 관리자가
 * 작업비를 오프라인 중개하는 에스크로 경로이며, `deposit_method='manual'`·payment_key NULL
 * (환불 라우트가 자동 차단)로 온라인(toss) 건과 구분된다. 온라인 결제 연동 시 웹훅
 * (confirmAndRecordDeposit)이 같은 전환을 자동 수행하므로 두 경로는 CAS로 상호배타.
 */
export async function confirmDepositManual(
  settlementId: string
): Promise<{ error?: string }> {
  await verifyAdmin()

  const { data: settlement } = await adminClient
    .from('settlement')
    .select('id, escrow_status, deal_id')
    .eq('id', settlementId)
    .single()

  if (!settlement) return { error: '정산 정보를 찾을 수 없습니다.' }

  // 재진입 보정: 직전 시도가 deposited까지 갔으나 deal 전이 전 실패했을 수 있다.
  // deposited인데 deal이 아직 quoted면 마저 전이하고 성공 처리(멱등).
  if (settlement.escrow_status !== 'pending') {
    if (settlement.escrow_status === 'deposited') {
      await startWorkIfQuoted(settlement.deal_id)
      revalidatePath('/dashboard')
      return {}
    }
    return { error: `현재 상태(${settlement.escrow_status})에서는 입금 확인이 불가합니다.` }
  }

  const { error } = await adminClient
    .from('settlement')
    .update({
      escrow_status: 'deposited',
      deposited_at: new Date().toISOString(),
      deposit_method: 'manual',
    })
    .eq('id', settlementId)
    .eq('escrow_status', 'pending')

  if (error) return { error: error.message }

  // 입금 확인 = 작업 시작. deal quoted→working (온라인 경로와 동일 전이, CAS로 멱등).
  const transitionErr = await startWorkIfQuoted(settlement.deal_id)
  if (transitionErr) {
    // settlement는 deposited인데 deal 전이 실패 — 재진입 시 위 보정 분기가 마저 처리한다.
    console.error(
      `[confirmDepositManual] CRITICAL: settlement ${settlementId} deposited인데 deal ${settlement.deal_id} 전이 실패:`,
      transitionErr,
    )
    return { error: '입금은 확인됐으나 작업 전환에 실패했습니다. 다시 시도하면 보정됩니다.' }
  }

  revalidatePath('/dashboard')
  return {}
}

export async function releaseSettlement(
  settlementId: string
): Promise<{ error?: string }> {
  await verifyAdmin()

  const { data: settlement } = await adminClient
    .from('settlement')
    .select('id, deal_id, escrow_status, guarantee_fee, deal:deal!inner(status, expert_id, request:request!inner(owner_id))')
    .eq('id', settlementId)
    .single()

  if (!settlement) return { error: '정산 정보를 찾을 수 없습니다.' }

  if (settlement.escrow_status !== 'deposited' && settlement.escrow_status !== 'reviewing') {
    return { error: `현재 상태(${settlement.escrow_status})에서는 정산 실행이 불가합니다.` }
  }

  // 검수 완료(done) 전 정산 금지 — quoted/working 상태에서 release하면 deal이 done으로 점프한다
  const dealStatus = (settlement.deal as unknown as { status: string }).status
  if (dealStatus !== 'done') {
    return { error: '검수가 완료되지 않은 거래입니다. 발주자 검수 확인 후 정산할 수 있습니다.' }
  }

  // open dispute 가드
  const { data: openDisputes } = await adminClient
    .from('dispute')
    .select('id')
    .eq('target_type', 'settlement')
    .eq('target_id', settlementId)
    .eq('status', 'open')
    .limit(1)

  if (openDisputes && openDisputes.length > 0) {
    return { error: '미해결 이의제기가 있어 정산을 실행할 수 없습니다. 이의제기를 먼저 처리해주세요.' }
  }

  // 에스크로 해제 — compare-and-set: 읽은 escrow_status와 동일할 때만 갱신.
  // (동시 실행·이중 클릭 시 두 번째 update는 0행 매칭 → 아래에서 중단시켜
  //  원장 이중적립·completed_deals 이중증가를 막는다. 감사 docs/11 P1-4)
  const { data: releasedRows, error: releaseError } = await adminClient
    .from('settlement')
    .update({
      escrow_status: 'released',
      released_at: new Date().toISOString(),
    })
    .eq('id', settlementId)
    .eq('escrow_status', settlement.escrow_status)
    .select('id')

  if (releaseError) return { error: releaseError.message }
  if (!releasedRows || releasedRows.length === 0) {
    return { error: '이미 처리되었거나 상태가 변경된 정산입니다.' }
  }

  // (deal.status는 이 함수 진입 가드(dealStatus==='done')로 이미 done이므로 재갱신하지 않는다.
  //  기존의 무조건 done 갱신은 죽은 쓰기였음 — 감사 P1-4.)

  // guarantee_fund_ledger 적립 — 실패는 금전 기록 유실이므로 CRITICAL로 표면화한다(감사 P1-4).
  // 정산 자체는 이미 released(CAS 성공)이므로 흐름은 중단하지 않고, 원장 보정 필요를 로그로 남긴다.
  if (settlement.guarantee_fee > 0) {
    const { error: ledgerErr } = await adminClient
      .from('guarantee_fund_ledger')
      .insert({
        settlement_id: settlementId,
        entry_type: 'accrue',
        amount: settlement.guarantee_fee,
        note: '에스크로 해제 — 책임 적립금 적립',
      })
    if (ledgerErr) {
      console.error(`[releaseSettlement] CRITICAL 원장 적립 실패(수동 보정 필요) settlement=${settlementId}:`, ledgerErr.message)
    }
  }

  // 시니어지식인 스코어 재계산 (completion_score 반영)
  const deal = settlement.deal as unknown as {
    expert_id: string | null
    request: { owner_id: string | null } | null
  } | null
  const expertId = deal?.expert_id
  if (expertId) {
    await recalcExpertScores(adminClient, expertId)
  }

  // owner.completed_deals 원자적 증가 (RPC — TOCTOU 방지)
  const ownerId = deal?.request?.owner_id
  if (ownerId) {
    const { error: incrError } = await adminClient
      .rpc('increment_completed_deals', { p_owner_id: ownerId, p_increment: 1 })
    if (incrError) {
      console.warn(`[releaseSettlement] owner ${ownerId} completed_deals increment failed:`, incrError.message)
    }
  }

  revalidatePath('/dashboard')
  return {}
}

export async function submitReview(
  dealId: string,
  rating: number,
  comment: string,
  internalNote: string,
  processRating?: number,
  resultRating?: number,
  responseRating?: number
): Promise<{ error?: string }> {
  await verifyAdmin()

  if (rating < 1 || rating > 5) return { error: '별점은 1~5 사이여야 합니다.' }

  // deal 존재 확인 + expert_id 조회 (스코어 재계산용)
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, expert_id')
    .eq('id', dealId)
    .single()

  if (!deal) return { error: '거래를 찾을 수 없습니다.' }

  // 중복 리뷰 확인
  const { data: existing } = await adminClient
    .from('review')
    .select('id')
    .eq('deal_id', dealId)
    .eq('author_type', 'admin')
    .single()

  if (existing) return { error: '이미 리뷰가 작성되었습니다.' }

  const insertData: Record<string, unknown> = {
    deal_id: dealId,
    author_type: 'admin',
    rating,
    comment: comment || null,
    internal_note: internalNote || null,
  }

  if (processRating) insertData.process_rating = processRating
  if (resultRating) insertData.result_rating = resultRating
  if (responseRating) insertData.response_rating = responseRating

  const { error: insertError } = await adminClient
    .from('review')
    .insert(insertData)

  if (insertError) return { error: insertError.message }

  // AI 제안이 있으면 상태 업데이트
  const isModified = processRating !== undefined
  await adminClient
    .from('review_ai_suggestion')
    .update({ status: isModified ? 'modified' : 'confirmed' })
    .eq('deal_id', dealId)
    .eq('status', 'pending')

  // 시니어지식인 스코어 재계산 (review_score + completion_score)
  if (deal.expert_id) {
    await recalcExpertScores(adminClient, deal.expert_id)
  }

  revalidatePath('/dashboard')
  return {}
}

/** AI 평가 제안 생성 */
export async function generateAiReview(dealId: string): Promise<{ error?: string }> {
  await verifyAdmin()

  // 이미 제안이 있는지 확인
  const { data: existing } = await adminClient
    .from('review_ai_suggestion')
    .select('id')
    .eq('deal_id', dealId)
    .limit(1)

  if (existing && existing.length > 0) return { error: '이미 AI 평가 제안이 존재합니다.' }

  const { data: deal } = await adminClient
    .from('deal')
    .select('id, status, due_date, created_at')
    .eq('id', dealId)
    .single()

  if (!deal) return { error: '거래를 찾을 수 없습니다.' }

  const [{ data: workflows }, { data: messages }, { data: ownerReview }] = await Promise.all([
    adminClient
      .from('deal_workflow')
      .select('step, status, created_at, updated_at')
      .eq('deal_id', dealId),
    adminClient
      .from('deal_message')
      .select('sender_type, created_at')
      .eq('deal_id', dealId),
    adminClient
      .from('review')
      .select('rating, comment')
      .eq('deal_id', dealId)
      .eq('author_type', 'owner')
      .single(),
  ])

  const aiResult = calculateAiRating({
    deal: { due_date: deal.due_date, created_at: deal.created_at, status: deal.status },
    workflows: (workflows || []).map((w) => ({
      step: w.step,
      status: w.status,
      created_at: w.created_at,
      updated_at: w.updated_at,
    })),
    messages: (messages || []).map((m) => ({
      sender_type: m.sender_type,
      created_at: m.created_at,
    })),
    ownerReview: ownerReview ? { rating: ownerReview.rating, comment: ownerReview.comment } : null,
  })

  const { error: insertError } = await adminClient
    .from('review_ai_suggestion')
    .insert({
      deal_id: dealId,
      process_rating: aiResult.process_rating,
      result_rating: aiResult.result_rating,
      response_rating: aiResult.response_rating,
      overall_rating: aiResult.overall_rating,
      reasoning: aiResult.reasoning,
      status: 'pending',
    })

  if (insertError) return { error: insertError.message }

  revalidatePath(`/review-input/${dealId}`)
  return {}
}

/** AI 평가 제안 조회 */
export async function getAiSuggestion(dealId: string) {
  await verifyAdmin()

  const { data } = await adminClient
    .from('review_ai_suggestion')
    .select('id, deal_id, process_rating, result_rating, response_rating, overall_rating, reasoning, status, created_at')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return { suggestion: data }
}

/** 이의제기 해결 처리 */
export async function resolveDispute(
  disputeId: string
): Promise<{ error?: string }> {
  await verifyAdmin()

  const { data: dispute } = await adminClient
    .from('dispute')
    .select('id, status')
    .eq('id', disputeId)
    .single()

  if (!dispute) return { error: '이의제기를 찾을 수 없습니다.' }
  if (dispute.status === 'resolved') return { error: '이미 해결된 이의제기입니다.' }

  const { error } = await adminClient
    .from('dispute')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', disputeId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

export async function getMessagesForDeal(dealId: string) {
  await verifyAdmin()

  const { data, error } = await adminClient
    .from('deal_message')
    .select('id, sender_type, sender_id, content, created_at')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })

  // 조회 실패를 빈 스레드로 위장하지 않는다 — 미읽음 배지와 모순되는 가짜 빈 상태(감사 docs/10 P2-6)
  if (error) {
    console.error('[admin] deal_message 조회 실패:', error)
  }

  return {
    messages: data || [],
    error: error ? '메시지를 불러오지 못했습니다.' : null,
  }
}

/** 정산 자동 release (대시보드 로드 시 실행) */
export async function runAutoRelease() {
  await verifyAdmin()

  const result = await autoReleaseSettlements(adminClient, recalcExpertScores, batchRecalcExpertScores)
  if (result.released > 0) revalidatePath('/dashboard')
  return result
}

export async function closeInquiry(inquiryId: string): Promise<{ error?: string }> {
  await verifyAdmin()

  const { error } = await adminClient
    .from('inquiry')
    .update({ status: 'closed' })
    .eq('id', inquiryId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}
