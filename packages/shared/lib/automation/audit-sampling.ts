/**
 * 5% 랜덤 감사 모듈
 *
 * platform_config.audit_sample_rate (기본 0.05) 확률로
 * 대상 레코드를 감사 대상으로 마킹한다.
 */

/** 캐싱된 감사 비율 (모듈 레벨 TTL 캐시) */
let auditRateCache: { rate: number; ts: number } | null = null
const AUDIT_RATE_TTL = 5 * 60 * 1000 // 5분

async function getAuditRate(
  adminClient: { from: (table: string) => any }
): Promise<number> {
  if (auditRateCache && Date.now() - auditRateCache.ts < AUDIT_RATE_TTL) {
    return auditRateCache.rate
  }
  const { data: config } = await adminClient
    .from('platform_config')
    .select('value')
    .eq('key', 'audit_sample_rate')
    .single()
  const rate = config ? parseFloat(config.value) : 0.05
  auditRateCache = { rate, ts: Date.now() }
  return rate
}

/**
 * 배치 감사 샘플링 — 여러 레코드를 한 번의 config 조회로 처리
 * @returns 감사 대상으로 마킹된 id 목록
 */
export async function batchApplyAuditSampling(
  adminClient: { from: (table: string) => any },
  table: 'deal' | 'settlement' | 'review',
  ids: string[]
): Promise<string[]> {
  if (ids.length === 0) return []

  const rate = await getAuditRate(adminClient)
  const sampledIds: string[] = []
  const passedIds: string[] = []

  for (const id of ids) {
    if (Math.random() < rate) {
      sampledIds.push(id)
    } else {
      passedIds.push(id)
    }
  }

  // 일괄 업데이트
  if (sampledIds.length > 0) {
    const { error: auditError } = await adminClient
      .from(table)
      .update({ queue_status: 'audited', audit_sampled: true })
      .in('id', sampledIds)
    if (auditError) {
      console.error(`[audit-sampling] ${table} audit marking failed:`, auditError.message)
    }
  }
  if (passedIds.length > 0) {
    const { error: passError } = await adminClient
      .from(table)
      .update({ queue_status: 'auto_passed' })
      .in('id', passedIds)
    if (passError) {
      console.error(`[audit-sampling] ${table} auto_passed marking failed:`, passError.message)
    }
  }

  return sampledIds
}
