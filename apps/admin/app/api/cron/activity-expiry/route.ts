import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { batchExpireAndRecalc } from '@jisane/shared/expert-activity'

/**
 * 활동 가점 만료 크론 (배치 최적화)
 *
 * 만료된 expert_activity를 일괄 삭제하고
 * 영향받는 전문가의 activity_points를 재계산합니다.
 *
 * Vercel Cron 또는 수동 호출:
 * POST /api/cron/activity-expiry
 */
export async function POST() {
  try {
    const result = await batchExpireAndRecalc(adminClient)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[cron/activity-expiry] unhandled error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
