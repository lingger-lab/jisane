import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { batchExpireAndRecalc } from '@jisane/shared/expert-activity'

/**
 * 활동 가점 만료 크론 (배치 최적화)
 *
 * 만료된 expert_activity를 일괄 삭제하고
 * 영향받는 시니어지식인의 activity_points를 재계산합니다.
 *
 * Vercel Cron 또는 수동 호출:
 * POST /api/cron/activity-expiry
 */
async function handle(request: Request) {
  // Vercel Cron은 CRON_SECRET 설정 시 Authorization: Bearer <secret>을 보낸다.
  // 시크릿 미설정이면 무인증 상태 변이가 되므로 실행을 거부한다 (fail-closed).
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await batchExpireAndRecalc(adminClient)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[cron/activity-expiry] unhandled error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

// Vercel Cron은 GET으로 호출한다. POST는 수동 트리거용으로 유지.
export const GET = handle
export const POST = handle
