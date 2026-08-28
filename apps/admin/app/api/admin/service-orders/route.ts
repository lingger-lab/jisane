import { NextResponse } from 'next/server'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { adminClient } from '@jisane/shared/supabase/admin'
import { isValidServiceOrderTransition } from '@jisane/shared/service-order/transitions'

export async function GET(request: Request) {
  try {
    await verifyAdmin()
  } catch {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = adminClient
    .from('service_order')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders: data })
}

export async function PATCH(request: Request) {
  try {
    await verifyAdmin()
  } catch {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const body = await request.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
  }

  const validStatuses = ['pending', 'paid', 'processing', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // 현재 상태 조회 → 유효 전이 검증(임의 점프 차단)
  const { data: current, error: readErr } = await adminClient
    .from('service_order')
    .select('status')
    .eq('id', id)
    .single()
  if (readErr || !current) {
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
  }
  const from = current.status as string
  if (!isValidServiceOrderTransition(from, status)) {
    return NextResponse.json({ error: `전이 불가: ${from} → ${status}` }, { status: 400 })
  }

  // CAS — 조회~수정 사이 경합 전이를 덮어쓰지 않도록 기대상태 predicate + 0행 실패
  const { data: updated, error } = await adminClient
    .from('service_order')
    .update({ status })
    .eq('id', id)
    .eq('status', from)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: '상태가 이미 변경되었습니다. 새로고침 후 다시 시도해주세요.' }, { status: 409 })
  }

  return NextResponse.json({ success: true })
}
