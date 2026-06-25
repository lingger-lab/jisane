import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'

/**
 * 관리자 전용: 에스크로 해제 + 정산 실행
 * POST /api/settlements/[id]/release
 * Header: x-admin-secret
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: settlementId } = await props.params

  // 관리자 인증
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // settlement 조회
  const { data: settlement } = await adminClient
    .from('settlement')
    .select('id, deal_id, escrow_status, guarantee_fee, payment_key')
    .eq('id', settlementId)
    .single()

  if (!settlement) {
    return NextResponse.json({ error: 'Settlement not found' }, { status: 404 })
  }

  if (settlement.escrow_status !== 'deposited' && settlement.escrow_status !== 'reviewing') {
    return NextResponse.json(
      { error: `Cannot release: current status is ${settlement.escrow_status}` },
      { status: 400 }
    )
  }

  // 에스크로 해제
  const { error: updateError } = await adminClient
    .from('settlement')
    .update({
      escrow_status: 'released',
      released_at: new Date().toISOString(),
    })
    .eq('id', settlementId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // deal.status → 'done'
  await adminClient
    .from('deal')
    .update({ status: 'done' })
    .eq('id', settlement.deal_id)

  // guarantee_fund_ledger에 적립금 적립 (accrue)
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

  return NextResponse.json({ success: true })
}
