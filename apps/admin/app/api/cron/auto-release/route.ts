import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { autoReleaseSettlements } from '@jisane/shared/automation/auto-settlement'
import { recalcExpertScores, batchRecalcExpertScores } from '@jisane/shared/expert-scoring'

/**
 * 정산 자동 release 크론 — 검수 완료(reviewing) 후 3일 경과 정산을 자동 해제.
 *
 * 기존에는 관리자가 대시보드를 열 때만 실행돼(runAutoRelease) 대시보드 미접속 시
 * 자동정산이 멈추는 문제가 있었다. Vercel Cron이 매일 호출한다 (vercel.json).
 * Vercel Cron은 CRON_SECRET 설정 시 Authorization: Bearer <secret>으로 호출한다.
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await autoReleaseSettlements(adminClient, recalcExpertScores, batchRecalcExpertScores)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[cron/auto-release] unhandled error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

// Vercel Cron은 GET으로 호출한다. POST는 수동 트리거용으로 유지.
export const GET = handle
export const POST = handle
