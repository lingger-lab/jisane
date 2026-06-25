import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

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
    .select('*, deal:deal!inner(id, request_id, partner_id, work_fee, match_fee, total_pay, status)')
    .eq('id', settlementId)
    .single()

  if (!settlement) {
    return NextResponse.json({ error: 'Settlement not found' }, { status: 404 })
  }

  // 소유권 확인: 기업(client) 또는 시니어
  const deal = settlement.deal as unknown as {
    id: string
    request_id: string
    partner_id: string
    work_fee: number
    match_fee: number
    total_pay: number
    status: string
  }

  // 파트너 확인
  const { data: partner } = await adminClient
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (partner && deal.partner_id === partner.id) {
    return NextResponse.json({ settlement })
  }

  // 기업 확인
  const { data: req } = await adminClient
    .from('request')
    .select('client_id')
    .eq('id', deal.request_id)
    .single()

  if (req) {
    const { data: client } = await adminClient
      .from('client')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (client && req.client_id === client.id) {
      return NextResponse.json({ settlement })
    }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
