import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'

export async function GET(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [requestsRes, dealsRes, settlementsRes, accrueRes, payoutRes] = await Promise.all([
    adminClient.from('request').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    adminClient.from('deal').select('id', { count: 'exact', head: true }).eq('status', 'working'),
    adminClient.from('settlement').select('id', { count: 'exact', head: true }).in('escrow_status', ['deposited', 'reviewing']),
    adminClient.from('guarantee_fund_ledger').select('amount').eq('entry_type', 'accrue'),
    adminClient.from('guarantee_fund_ledger').select('amount').eq('entry_type', 'payout'),
  ])

  // 조회 실패 시 "전부 0"이라는 그럴듯한 거짓 대신 실패를 그대로 알린다(감사 docs/10 P2-10 fail-loud).
  const queryError =
    requestsRes.error || dealsRes.error || settlementsRes.error || accrueRes.error || payoutRes.error
  if (queryError) {
    console.error('[admin/summary] 요약 지표 조회 실패:', queryError)
    return NextResponse.json({ error: '요약 지표 조회에 실패했습니다.' }, { status: 500 })
  }

  const accrueTotal = (accrueRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
  const payoutTotal = (payoutRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0)

  return NextResponse.json({
    matchingWaiting: requestsRes.count || 0,
    inProgress: dealsRes.count || 0,
    settlementReady: settlementsRes.count || 0,
    guaranteeFundBalance: accrueTotal - payoutTotal,
  })
}
