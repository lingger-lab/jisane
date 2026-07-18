/**
 * 활동 가점 모듈
 *
 * expert_activity 테이블에서 유효 기간 내 활동 포인트를 합산하여
 * expert.activity_points를 갱신한다.
 *
 * 포인트: band_join = +1.0, post = +0.5
 * 상한: +2.0
 * 유효: expires_at > NOW() (3개월)
 */

const ACTIVITY_POINTS: Record<string, number> = {
  band_join: 1.0,
  post: 0.5,
}

const MAX_ACTIVITY_POINTS = 2.0

/** 활동 유형별 기본 포인트 조회 */
export function getDefaultPoints(type: string): number {
  return ACTIVITY_POINTS[type] ?? 0
}

/**
 * 전문가의 activity_points를 재계산하여 expert 테이블에 반영
 * SUM(points WHERE expires_at IS NULL OR expires_at > NOW()), 상한 2.0
 */
export async function recalcActivityPoints(
  adminClient: { from: (table: string) => any },
  expertId: string
): Promise<number> {
  const { data: activities } = await adminClient
    .from('expert_activity')
    .select('points, expires_at')
    .eq('expert_id', expertId)

  const now = new Date()
  const activePoints = (activities ?? [])
    .filter((a: { expires_at: string | null }) => !a.expires_at || new Date(a.expires_at) > now)
    .reduce((sum: number, a: { points: number }) => sum + (a.points ?? 0), 0)

  const capped = Math.min(activePoints, MAX_ACTIVITY_POINTS)
  const rounded = Math.round(capped * 10) / 10

  await adminClient
    .from('expert')
    .update({ activity_points: rounded })
    .eq('id', expertId)

  return rounded
}

/**
 * 배치: 만료 활동 삭제 + 영향받는 전문가 activity_points 재계산
 * 기존 cron의 N+1 패턴(expert별 개별 조회+삭제) → 배치 3쿼리로 대체
 */
export async function batchExpireAndRecalc(
  adminClient: { from: (table: string) => any }
): Promise<{ deleted: number; recalced: number }> {
  const now = new Date().toISOString()

  // 1. 만료 활동 삭제 + RETURNING으로 expert_id 추출 (1쿼리 — TOCTOU 시간 갭 최소화)
  const { data: deleted, error: deleteError } = await adminClient
    .from('expert_activity')
    .delete()
    .lt('expires_at', now)
    .select('expert_id')

  if (deleteError) {
    console.error('[expert-activity] expired activity delete failed:', deleteError.message)
    return { deleted: 0, recalced: 0 }
  }

  if (!deleted || deleted.length === 0) return { deleted: 0, recalced: 0 }

  const affectedExpertIds = [...new Set((deleted as Array<{ expert_id: string }>).map((a) => a.expert_id))]

  // 2. 영향받는 전문가의 남은 활동 일괄 조회 (1쿼리 + N update)
  const { data: remaining } = await adminClient
    .from('expert_activity')
    .select('expert_id, points, expires_at')
    .in('expert_id', affectedExpertIds)

  const pointsByExpert = new Map<string, number>()
  for (const id of affectedExpertIds) pointsByExpert.set(id, 0)
  const nowDate = new Date()
  for (const a of remaining ?? []) {
    if (!a.expires_at || new Date(a.expires_at) > nowDate) {
      pointsByExpert.set(a.expert_id, (pointsByExpert.get(a.expert_id) || 0) + (a.points ?? 0))
    }
  }

  let recalcFailed = 0
  for (const [expertId, points] of pointsByExpert) {
    const capped = Math.min(points, MAX_ACTIVITY_POINTS)
    const rounded = Math.round(capped * 10) / 10
    const { error: updateError } = await adminClient
      .from('expert')
      .update({ activity_points: rounded })
      .eq('id', expertId)
    if (updateError) {
      console.warn(`[expert-activity] update failed for expert ${expertId}:`, updateError.message)
      recalcFailed++
    }
  }
  if (recalcFailed > 0) {
    console.warn(`[expert-activity] ${recalcFailed}/${affectedExpertIds.length} expert updates failed`)
  }

  console.info(`[expert-activity] completed: deleted=${deleted.length}, recalced=${affectedExpertIds.length - recalcFailed}`)
  return { deleted: deleted.length, recalced: affectedExpertIds.length }
}
