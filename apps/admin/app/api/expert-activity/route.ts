import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { getDefaultPoints, recalcActivityPoints } from '@jisane/shared/expert-activity'

/**
 * POST /api/expert-activity
 * 관리자가 전문가 활동(band_join/post)을 등록
 * body: { expert_id, type, approved_by }
 */
export async function POST(req: NextRequest) {
  try {
    await verifyAdmin()
  } catch {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const body = await req.json()
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

  const updatedPoints = await recalcActivityPoints(adminClient, expert_id)

  return NextResponse.json({ ok: true, activity_points: updatedPoints })
}
