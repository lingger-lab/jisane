import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { getDefaultPoints, recalcActivityPoints } from '@jisane/shared/expert-activity'

/**
 * POST /api/expert-activity
 * 관리자가 시니어지식인 활동(band_join/post)을 등록
 * body: { expert_id, type, approved_by }
 */
export async function POST(req: NextRequest) {
  try {
    await verifyAdmin()
  } catch {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }
  const { expert_id, type, approved_by } = body as {
    expert_id?: string
    type?: string
    approved_by?: string
  }

  if (!expert_id || !type) {
    return NextResponse.json({ error: 'expert_id, type은 필수입니다.' }, { status: 400 })
  }

  if (!['band_join', 'post'].includes(type)) {
    return NextResponse.json({ error: '유효하지 않은 활동 유형입니다.' }, { status: 400 })
  }

  const points = getDefaultPoints(type)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // +3개월

  const { error: insertErr } = await adminClient
    .from('expert_activity')
    .insert({
      expert_id,
      type,
      points,
      approved_by: approved_by || null,
      expires_at: expiresAt.toISOString(),
    })

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  const recalc = await recalcActivityPoints(adminClient, expert_id)

  // 활동 행은 이미 저장됨 — 재계산 실패를 500으로 돌리면 관리자가 재시도해 활동이
  // 중복 등록되므로(멱등키 없음, P2-11), ok + warning으로 정직하게 알린다.
  if ('error' in recalc) {
    return NextResponse.json({
      ok: true,
      activity_points: null,
      warning: `활동은 등록됐으나 포인트 재계산에 실패했습니다: ${recalc.error} 같은 활동을 다시 등록하지 마세요 — 다음 활동 등록 시 함께 재계산됩니다.`,
    })
  }

  return NextResponse.json({ ok: true, activity_points: recalc.points })
}
