import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { createCheckoutSession } from '@/lib/payment'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { deal_id } = body

  if (!deal_id) {
    return NextResponse.json({ error: 'deal_id is required' }, { status: 400 })
  }

  // deal 조회 + 소유권 확인 (사장님 = request.client_id)
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, request_id, total_pay, status, work_fee, match_fee')
    .eq('id', deal_id)
    .single()

  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  if (deal.status !== 'quoted') {
    return NextResponse.json({ error: 'Deal is not in quoted status' }, { status: 400 })
  }

  // 사장님 소유권: request.client_id → client.auth_user_id
  const { data: req } = await adminClient
    .from('request')
    .select('id, client_id, title')
    .eq('id', deal.request_id)
    .single()

  if (!req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const { data: client } = await adminClient
    .from('client')
    .select('id, auth_user_id')
    .eq('id', req.client_id)
    .single()

  if (!client || client.auth_user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await createCheckoutSession(
      deal.id,
      deal.total_pay,
      `곁에 작업 — ${req.title || '의뢰'}`
    )

    // settlement에 payment_key 저장
    await adminClient
      .from('settlement')
      .update({ payment_key: result.paymentKey })
      .eq('deal_id', deal.id)

    return NextResponse.json({
      checkout_url: result.checkoutUrl,
      payment_key: result.paymentKey,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Payment session creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
