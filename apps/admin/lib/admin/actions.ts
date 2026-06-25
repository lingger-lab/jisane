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

  const { data: req } = await adminClient
    .from('request')
    .select('id, title, detail, req_type')
    .eq('id', requestId)
    .single()

  if (!req) return { candidates: [] }

  const { data: partners } = await adminClient
    .from('partner')
    .select('*')
    .eq('status', 'active')

  const candidates = findCandidates(
    { title: req.title, detail: req.detail, req_type: req.req_type },
    (partners || []) as PartnerRow[]
  )

  return {
    candidates: candidates.map((c) => ({
      partner_id: c.partner.id,
      name: c.partner.name,
      field: c.partner.field,
      career_yrs: c.partner.career_yrs,
      score: c.score,
    })),
  }
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
