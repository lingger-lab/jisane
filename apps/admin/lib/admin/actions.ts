'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { findCandidates } from '@jisane/shared/matching-algo'
import { calculateAiRating } from '@jisane/shared/review-algo'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import type { PartnerRow } from '@jisane/shared/types'
import type { InterestWithPartner } from '@jisane/shared/query-types'
import type { CategoryRow } from '@jisane/shared/categories'

export async function getCandidatesForRequest(requestId: string) {
  await verifyAdmin()

  // 기존 AI 후보가 있는지 확인
  const { data: existingCandidates } = await adminClient
    .from('matching_candidate')
    .select('id, partner_id, rank, score, score_detail, status, auto_assign_at, created_at')
    .eq('request_id', requestId)
    .order('rank', { ascending: true })

  // AI 후보가 이미 있으면 그 데이터를 반환
  if (existingCandidates && existingCandidates.length > 0) {
    const partnerIds = existingCandidates.map((c) => c.partner_id)
    const { data: partnerData } = await adminClient
      .from('partner')
      .select('id, name, field, career_yrs')
      .in('id', partnerIds)

    const partnerMap = new Map((partnerData || []).map((p) => [p.id, p]))

    const candidates = existingCandidates.map((c) => {
      const p = partnerMap.get(c.partner_id)
      return {
        partner_id: c.partner_id,
        name: p?.name || null,
        field: p?.field || null,
        career_yrs: p?.career_yrs || null,
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
      .from('partner_interest')
      .select('partner_id, note, partner:partner!inner(id, name, field, career_yrs)')
      .eq('request_id', requestId)
      .returns<InterestWithPartner[]>(),
  ])

  if (!req) return { candidates: [], hasAiCandidates: false }

  const [{ data: partners }, { data: categories }, { data: partnerCategories }] = await Promise.all([
    adminClient.from('partner').select('*').eq('status', 'active'),
    adminClient.from('category').select('id, parent_id, depth, label, slug, sort_order'),
    adminClient.from('partner_category').select('partner_id, category_id'),
  ])

  // 관심 표현 목록
  const interestList = (interests || []).map((i) => ({ partner_id: i.partner_id }))

  const candidates = findCandidates(
    { title: req.title, detail: req.detail, req_type: req.req_type, category_id: req.category_id },
    (partners || []) as PartnerRow[],
    {
      categories: (categories || []) as CategoryRow[],
      partnerCategories: partnerCategories || [],
      interests: interestList,
      partnerStats: [],
    }
  )

  // 관심 표현 파트너 매핑
  const interestMap = new Map<string, string | null>()
  for (const i of (interests || [])) {
    interestMap.set(i.partner_id, i.note)
  }

  const candidateIds = new Set(candidates.map((c) => c.partner.id))
  const merged = candidates.map((c, idx) => ({
    partner_id: c.partner.id,
    name: c.partner.name,
    field: c.partner.field,
    career_yrs: c.partner.career_yrs,
    score: c.score,
    score_detail: c.scoreDetail as Record<string, number> | null,
    rank: idx + 1,
    status: 'pending',
    auto_assign_at: null as string | null,
    interested: interestMap.has(c.partner.id),
    interest_note: interestMap.get(c.partner.id) || null,
  }))

  // 관심 표현했지만 알고리즘 후보가 아닌 파트너 추가
  for (const i of (interests || [])) {
    if (!candidateIds.has(i.partner_id)) {
      merged.push({
        partner_id: i.partner_id,
        name: i.partner.name,
        field: i.partner.field,
        career_yrs: i.partner.career_yrs,
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

  // 관심 표현 파트너를 상단으로 정렬
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

  const [{ data: partners }, { data: categories }, { data: partnerCategories }, { data: interests }] = await Promise.all([
    adminClient.from('partner').select('*').eq('status', 'active'),
    adminClient.from('category').select('id, parent_id, depth, label, slug, sort_order'),
    adminClient.from('partner_category').select('partner_id, category_id'),
    adminClient.from('partner_interest').select('partner_id').eq('request_id', requestId),
  ])

  const candidates = findCandidates(
    { title: req.title, detail: req.detail, req_type: req.req_type, category_id: req.category_id },
    (partners || []) as PartnerRow[],
    {
      categories: (categories || []) as CategoryRow[],
      partnerCategories: partnerCategories || [],
      interests: interests || [],
      partnerStats: [],
    },
    3
  )

  if (candidates.length === 0) return { error: '적합한 후보가 없습니다.' }

  const autoAssignAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const rows = candidates.map((c, idx) => ({
    request_id: requestId,
    partner_id: c.partner.id,
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
  partnerId: string
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
    .neq('partner_id', partnerId)

  await adminClient
    .from('matching_candidate')
    .update({ status: 'selected' })
    .eq('request_id', requestId)
    .eq('partner_id', partnerId)

  // matching 생성
  const { error: matchError } = await adminClient
    .from('matching')
    .insert({
      request_id: requestId,
      partner_id: partnerId,
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

/** 24시간 초과 시 1순위 자동 배정 체크 */
export async function autoAssignOverdue(): Promise<number> {
  const { data: overdue } = await adminClient
    .from('matching_candidate')
    .select('id, request_id, partner_id, rank')
    .eq('status', 'pending')
    .eq('rank', 1)
    .lt('auto_assign_at', new Date().toISOString())

  let assigned = 0
  for (const c of overdue || []) {
    const { data: req } = await adminClient
      .from('request')
      .select('id, status')
      .eq('id', c.request_id)
      .single()

    if (req?.status !== 'open') continue

    await adminClient
      .from('matching_candidate')
      .update({ status: 'selected' })
      .eq('id', c.id)

    await adminClient
      .from('matching_candidate')
      .update({ status: 'skipped' })
      .eq('request_id', c.request_id)
      .neq('id', c.id)

    await adminClient
      .from('matching')
      .insert({
        request_id: c.request_id,
        partner_id: c.partner_id,
        status: 'proposed',
      })

    await adminClient
      .from('request')
      .update({ status: 'matching' })
      .eq('id', c.request_id)

    assigned++
  }

  if (assigned > 0) revalidatePath('/dashboard')
  return assigned
}

export async function createMatching(
  requestId: string,
  partnerId: string
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

  // 파트너 확인
  const { data: partner } = await adminClient
    .from('partner')
    .select('id, status')
    .eq('id', partnerId)
    .single()

  if (!partner) return { error: '파트너를 찾을 수 없습니다.' }
  if (partner.status !== 'active') return { error: '비활성 파트너입니다.' }

  // matching 생성
  const { error: matchError } = await adminClient
    .from('matching')
    .insert({
      request_id: requestId,
      partner_id: partnerId,
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
    .select('id, deal_id, escrow_status, guarantee_fee')
    .eq('id', settlementId)
    .single()

  if (!settlement) return { error: '정산 정보를 찾을 수 없습니다.' }

  if (settlement.escrow_status !== 'deposited' && settlement.escrow_status !== 'reviewing') {
    return { error: `현재 상태(${settlement.escrow_status})에서는 정산 실행이 불가합니다.` }
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

  // deal 존재 확인
  const { data: deal } = await adminClient
    .from('deal')
    .select('id')
    .eq('id', dealId)
    .single()

  if (!deal) return { error: '거래를 찾을 수 없습니다.' }

  // 중복 리뷰 확인
  const { data: existing } = await adminClient
    .from('review')
    .select('id')
    .eq('deal_id', dealId)
    .eq('author_type', 'gyeotae')
    .single()

  if (existing) return { error: '이미 리뷰가 작성되었습니다.' }

  const insertData: Record<string, unknown> = {
    deal_id: dealId,
    author_type: 'gyeotae',
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

  const [{ data: workflows }, { data: messages }, { data: clientReview }] = await Promise.all([
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
      .eq('author_type', 'client')
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
    clientReview: clientReview ? { rating: clientReview.rating, comment: clientReview.comment } : null,
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

export async function getMessagesForDeal(dealId: string) {
  await verifyAdmin()

  const { data } = await adminClient
    .from('deal_message')
    .select('id, sender_type, sender_id, content, created_at')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })

  return { messages: data || [] }
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
