'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { findCandidates } from '@jisane/shared/matching-algo'
import { calculateAiRating } from '@jisane/shared/review-algo'
import { recalcExpertScores, batchRecalcExpertScores } from '@jisane/shared/expert-scoring'
import { autoReleaseSettlements } from '@jisane/shared/automation/auto-settlement'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
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
    adminClient.from('expert').select('*').eq('status', 'active'),
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

  // 관심 표현 전문가 매핑
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

  // 관심 표현했지만 알고리즘 후보가 아닌 전문가 추가
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

  // 관심 표현 전문가를 상단으로 정렬
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
    adminClient.from('expert').select('*').eq('status', 'active'),
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

  if (matchError) return { error: matchError.message }

  await adminClient
    .from('request')
    .update({ status: 'matching' })
    .eq('id', requestId)

  revalidatePath('/dashboard')
  return {}
}

/** 24시간 초과 시 1순위 자동 배정 체크 (배치 최적화) */
export async function autoAssignOverdue(): Promise<number> {
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
  const eligible = overdue.filter((c) => openRequestIds.has(c.request_id))
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

  // 전문가 확인
  const { data: expert } = await adminClient
    .from('expert')
    .select('id, status')
    .eq('id', expertId)
    .single()

  if (!expert) return { error: '전문가를 찾을 수 없습니다.' }
  if (expert.status !== 'active') return { error: '비활성 전문가입니다.' }

  // matching 생성
  const { error: matchError } = await adminClient
    .from('matching')
    .insert({
      request_id: requestId,
      expert_id: expertId,
      status: 'proposed',
    })

  if (matchError) return { error: matchError.message }

  // request.status → 'matching'
  await adminClient
    .from('request')
    .update({ status: 'matching' })
    .eq('id', requestId)

  revalidatePath('/dashboard')
  return {}
}

export async function releaseSettlement(
  settlementId: string
): Promise<{ error?: string }> {
  await verifyAdmin()

  const { data: settlement } = await adminClient
    .from('settlement')
    .select('id, deal_id, escrow_status, guarantee_fee, deal:deal!inner(expert_id, request:request!inner(owner_id))')
    .eq('id', settlementId)
    .single()

  if (!settlement) return { error: '정산 정보를 찾을 수 없습니다.' }

  if (settlement.escrow_status !== 'deposited' && settlement.escrow_status !== 'reviewing') {
    return { error: `현재 상태(${settlement.escrow_status})에서는 정산 실행이 불가합니다.` }
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

  // 에스크로 해제
  await adminClient
    .from('settlement')
    .update({
      escrow_status: 'released',
      released_at: new Date().toISOString(),
    })
    .eq('id', settlementId)

  // deal.status → 'done'
  await adminClient
    .from('deal')
    .update({ status: 'done' })
    .eq('id', settlement.deal_id)

  // guarantee_fund_ledger 적립
  if (settlement.guarantee_fee > 0) {
    await adminClient
      .from('guarantee_fund_ledger')
      .insert({
        settlement_id: settlementId,
        entry_type: 'accrue',
        amount: settlement.guarantee_fee,
        note: '에스크로 해제 — 책임 적립금 적립',
      })
  }

  // 전문가 스코어 재계산 (completion_score 반영)
  const deal = settlement.deal as any
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

  // 전문가 스코어 재계산 (review_score + completion_score)
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

  const { data } = await adminClient
    .from('deal_message')
    .select('id, sender_type, sender_id, content, created_at')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })

  return { messages: data || [] }
}

/** 정산 자동 release (대시보드 로드 시 실행) */
export async function runAutoRelease() {
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
