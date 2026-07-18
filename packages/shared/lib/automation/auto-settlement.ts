/**
 * 정산 자동 release 엔진 (배치 최적화)
 *
 * 조건:
 * - deal.status = 'done'
 * - settlement.escrow_status = 'reviewing'
 * - 해당 settlement에 open dispute 없음
 * - reviewing 상태 전환 후 3일 경과
 *
 * 실행:
 * - escrow_status → released (일괄)
 * - auto_processed = true
 * - audit sampling 적용 (배치)
 * - guarantee_fund_ledger 적립 (일괄)
 * - expert score 재계산 (배치)
 * - owner.completed_deals 증가
 */

import { batchApplyAuditSampling } from './audit-sampling'

interface AutoReleaseResult {
  released: number
  audited: number
  skipped: number
}

export async function autoReleaseSettlements(
  adminClient: { from: (table: string) => any; rpc: (fn: string, params?: Record<string, any>) => any },
  recalcExpertScores: (adminClient: any, expertId: string) => Promise<any>,
  batchRecalc?: (adminClient: any, expertIds: string[]) => Promise<number>
): Promise<AutoReleaseResult> {
  const result: AutoReleaseResult = { released: 0, audited: 0, skipped: 0 }

  // 3일 전 기준 시간
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  // 1. reviewing 상태 + 3일 경과 정산 일괄 조회 (1쿼리)
  const { data: settlements } = await adminClient
    .from('settlement')
    .select(`
      id, deal_id, guarantee_fee, updated_at,
      deal:deal!inner(id, status, expert_id, request:request!inner(owner_id))
    `)
    .eq('escrow_status', 'reviewing')
    .lt('updated_at', threeDaysAgo)

  if (!settlements || settlements.length === 0) return result

  // 2. dispute 일괄 체크 (1쿼리)
  const settlementIds = settlements.map((s: any) => s.id)
  const { data: disputes } = await adminClient
    .from('dispute')
    .select('target_id')
    .eq('target_type', 'settlement')
    .in('target_id', settlementIds)
    .eq('status', 'open')

  const disputedIds = new Set((disputes || []).map((d: any) => d.target_id))

  // 3. eligible 필터링 (deal.status=done + dispute 없음)
  const eligible = settlements.filter((s: any) => {
    const deal = s.deal as any
    if (deal?.status !== 'done') return false
    if (disputedIds.has(s.id)) return false
    return true
  })

  result.skipped = settlements.length - eligible.length
  if (eligible.length === 0) return result

  const eligibleIds = eligible.map((s: any) => s.id)

  // 4. 정산 일괄 released (1쿼리)
  const { error: releaseError } = await adminClient
    .from('settlement')
    .update({
      escrow_status: 'released',
      released_at: new Date().toISOString(),
      auto_processed: true,
    })
    .in('id', eligibleIds)

  if (releaseError) {
    console.error('[auto-settlement] settlement batch release failed:', releaseError.message)
    return result
  }

  // 5. guarantee_fund_ledger 일괄 적립 (1쿼리)
  const ledgerRows = eligible
    .filter((s: any) => s.guarantee_fee > 0)
    .map((s: any) => ({
      settlement_id: s.id,
      entry_type: 'accrue',
      amount: s.guarantee_fee,
      note: '자동 정산 — 책임 적립금 적립',
    }))
  if (ledgerRows.length > 0) {
    const { error: ledgerError } = await adminClient.from('guarantee_fund_ledger').insert(ledgerRows)
    if (ledgerError) {
      console.error('[auto-settlement] ledger insert failed:', ledgerError.message)
    }
  }

  // 6. 배치 감사 샘플링 (2쿼리 — config 캐싱 + 일괄 update)
  const sampledIds = await batchApplyAuditSampling(adminClient, 'settlement', eligibleIds)
  result.audited = sampledIds.length

  // 7. expert score 배치 재계산
  const expertIds = [...new Set(
    eligible
      .map((s: any) => (s.deal as any)?.expert_id)
      .filter(Boolean) as string[]
  )]
  if (expertIds.length > 0) {
    try {
      if (batchRecalc) {
        const updated = await batchRecalc(adminClient, expertIds)
        console.info(`[auto-settlement] expert scores recalculated: ${updated}/${expertIds.length}`)
      } else {
        for (const eid of expertIds) {
          await recalcExpertScores(adminClient, eid)
        }
      }
    } catch (err) {
      console.error('[auto-settlement] expert score recalc failed:', err)
    }
  }

  // 8. owner.completed_deals 원자적 증가 (RPC — TOCTOU 방지)
  const ownerIncrements = new Map<string, number>()
  for (const s of eligible) {
    const ownerId = (s.deal as any)?.request?.owner_id
    if (ownerId) {
      ownerIncrements.set(ownerId, (ownerIncrements.get(ownerId) || 0) + 1)
    }
  }
  for (const [ownerId, increment] of ownerIncrements) {
    const { error: incrError } = await adminClient
      .rpc('increment_completed_deals', { p_owner_id: ownerId, p_increment: increment })
    if (incrError) {
      console.warn(`[auto-settlement] owner ${ownerId} completed_deals increment failed:`, incrError.message)
    }
  }

  result.released = eligible.length
  console.info(`[auto-settlement] completed: released=${result.released}, audited=${result.audited}, skipped=${result.skipped}`)
  return result
}
