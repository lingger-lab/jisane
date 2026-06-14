import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 전체 잔액 계산
  const [accrueRes, payoutRes] = await Promise.all([
    adminClient.from('guarantee_fund_ledger').select('amount').eq('entry_type', 'accrue'),
    adminClient.from('guarantee_fund_ledger').select('amount').eq('entry_type', 'payout'),
  ])

  const accrueTotal = (accrueRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
  const payoutTotal = (payoutRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0)

  // 최근 20건 원장
  const { data: entries } = await adminClient
    .from('guarantee_fund_ledger')
    .select('id, settlement_id, entry_type, amount, note, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({
    balance: accrueTotal - payoutTotal,
    entries: entries || [],
  })
}
