import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

/**
 * POST /api/disputes
 * 기업(owner)이 정산 이의제기 생성
 * body: { settlement_id, reason }
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { data: owner } = await adminClient
    .from('owner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!owner) {
    return NextResponse.json({ error: '기업 정보를 찾을 수 없습니다.' }, { status: 403 })
  }

  const body = await req.json()
  const { settlement_id, reason } = body as { settlement_id?: string; reason?: string }

  if (!settlement_id || !reason?.trim()) {
    return NextResponse.json({ error: 'settlement_id와 reason은 필수입니다.' }, { status: 400 })
  }

  // 정산 소유권 확인 (settlement → deal → request → owner_id)
  const { data: settlement } = await adminClient
    .from('settlement')
    .select('id, deal:deal!inner(request:request!inner(owner_id))')
    .eq('id', settlement_id)
    .single()

  if (!settlement) {
    return NextResponse.json({ error: '정산 정보를 찾을 수 없습니다.' }, { status: 404 })
  }

  const deal = settlement.deal as unknown as { request: { owner_id: string } | null } | null
  if (deal?.request?.owner_id !== owner.id) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  // 중복 확인
  const { data: existing } = await adminClient
    .from('dispute')
    .select('id')
    .eq('target_type', 'settlement')
    .eq('target_id', settlement_id)
    .eq('status', 'open')
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: '이미 처리 중인 이의제기가 있습니다.' }, { status: 409 })
  }

  const { error: insertErr } = await adminClient
    .from('dispute')
    .insert({
      target_type: 'settlement',
      target_id: settlement_id,
      raised_by: 'owner',
      reason: reason.trim(),
    })

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
