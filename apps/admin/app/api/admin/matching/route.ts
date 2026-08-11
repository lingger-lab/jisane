import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'

export async function POST(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { request_id?: string; expert_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }
  const { request_id, expert_id } = body

  if (!request_id || !expert_id) {
    return NextResponse.json({ error: 'request_id and expert_id are required' }, { status: 400 })
  }

  // 의뢰 상태 확인
  const { data: req } = await adminClient
    .from('request')
    .select('id, status')
    .eq('id', request_id)
    .single()

  if (!req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  if (req.status !== 'open') {
    return NextResponse.json({ error: 'Request is not in open status' }, { status: 400 })
  }

  // matching 생성
  const { data: created, error: matchError } = await adminClient
    .from('matching')
    .insert({
      request_id,
      expert_id,
      status: 'proposed',
    })
    .select('id')
    .single()

  if (matchError || !created) {
    console.error('[admin/matching] matching insert failed:', matchError?.message)
    return NextResponse.json({ error: '매칭 생성에 실패했습니다.' }, { status: 500 })
  }

  // request.status → 'matching' — CAS(open일 때만)로 경쟁 POST의 이중 매칭을 차단하고,
  // 실패·0행이면 방금 만든 matching을 보상 삭제해 고아 행을 남기지 않는다(감사 docs/11 P2-8/P2-9)
  const { data: reqUpdated, error: reqError } = await adminClient
    .from('request')
    .update({ status: 'matching' })
    .eq('id', request_id)
    .eq('status', 'open')
    .select('id')

  if (reqError || !reqUpdated || reqUpdated.length === 0) {
    const { error: compErr } = await adminClient
      .from('matching')
      .delete()
      .eq('id', created.id)
    if (compErr) {
      console.error(
        `[admin/matching] CRITICAL: request ${request_id} 상태 전환 실패 후 matching ${created.id} 보상 삭제도 실패 — 수동 정합 필요:`,
        compErr.message
      )
    } else {
      console.error(
        `[admin/matching] request ${request_id} 상태 전환 실패(경쟁 매칭 또는 DB 오류) — matching 롤백됨:`,
        reqError?.message ?? '0 rows (status!=open)'
      )
    }
    return NextResponse.json(
      { error: '의뢰 상태 전환에 실패했습니다. 이미 매칭이 진행 중일 수 있습니다.' },
      { status: 409 }
    )
  }

  return NextResponse.json({ success: true })
}
