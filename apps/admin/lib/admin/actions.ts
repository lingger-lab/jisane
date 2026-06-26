'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { findCandidates } from '@/lib/matching-algo'
import type { PartnerRow } from '@jisane/shared/types'

async function verifyAdmin(): Promise<{ email: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    throw new Error('Unauthorized')
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim())
  if (!adminEmails.includes(user.email)) {
    throw new Error('Forbidden')
  }

  return { email: user.email }
}

export async function getCandidatesForRequest(requestId: string) {
  await verifyAdmin()

  const [{ data: req }, { data: interests }] = await Promise.all([
    adminClient
      .from('request')
      .select('id, title, detail, req_type')
      .eq('id', requestId)
      .single(),
    adminClient
      .from('partner_interest')
      .select('partner_id, note, partner:partner!inner(id, name, field, career_yrs)')
      .eq('request_id', requestId),
  ])

  if (!req) return { candidates: [] }

  const { data: partners } = await adminClient
    .from('partner')
    .select('*')
    .eq('status', 'active')

  const candidates = findCandidates(
    { title: req.title, detail: req.detail, req_type: req.req_type },
    (partners || []) as PartnerRow[]
  )

  // 관심 표현 파트너 매핑
  const interestMap = new Map<string, string | null>()
  for (const i of (interests || []) as Array<{ partner_id: string; note: string | null }>) {
    interestMap.set(i.partner_id, i.note)
  }

  // 알고리즘 후보에 관심 표현 플래그 추가
  const candidateIds = new Set(candidates.map((c) => c.partner.id))
  const merged = candidates.map((c) => ({
    partner_id: c.partner.id,
    name: c.partner.name,
    field: c.partner.field,
    career_yrs: c.partner.career_yrs,
    score: c.score,
    interested: interestMap.has(c.partner.id),
    interest_note: interestMap.get(c.partner.id) || null,
  }))

  // 관심 표현했지만 알고리즘 후보가 아닌 파트너 추가
  for (const i of (interests || []) as unknown as Array<{ partner_id: string; note: string | null; partner: { id: string; name: string | null; field: string | null; career_yrs: number | null } }>) {
    if (!candidateIds.has(i.partner_id)) {
      merged.push({
        partner_id: i.partner_id,
        name: i.partner.name,
        field: i.partner.field,
        career_yrs: i.partner.career_yrs,
        score: 0,
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

  return { candidates: merged }
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
  internalNote: string
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

  const { error: insertError } = await adminClient
    .from('review')
    .insert({
      deal_id: dealId,
      author_type: 'gyeotae',
      rating,
      comment: comment || null,
      internal_note: internalNote || null,
    })

  if (insertError) return { error: insertError.message }

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
