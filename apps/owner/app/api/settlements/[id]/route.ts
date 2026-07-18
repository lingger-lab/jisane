import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import type { SettlementWithDealFlat } from '@jisane/shared/query-types'

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: settlementId } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // settlement + deal 조회
  const { data: settlement } = await adminClient
    .from('settlement')
    .select('*, deal:deal!inner(id, request_id, expert_id, work_fee, match_fee, total_pay, status)')
    .eq('id', settlementId)
    .returns<SettlementWithDealFlat[]>()
    .single()

  if (!settlement) {
    return NextResponse.json({ error: 'Settlement not found' }, { status: 404 })
  }

  // 소유권 확인: 기업(owner) 또는 전문가(expert)
  const deal = settlement.deal

  // 전문가 확인
  const { data: expert } = await adminClient
    .from('expert')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (expert && deal.expert_id === expert.id) {
    return NextResponse.json({ settlement })
  }

  // 기업 확인
  const { data: req } = await adminClient
    .from('request')
    .select('owner_id')
    .eq('id', deal.request_id)
    .single()

  if (req) {
    const { data: ownerRow } = await adminClient
      .from('owner')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (ownerRow && req.owner_id === ownerRow.id) {
      return NextResponse.json({ settlement })
    }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
