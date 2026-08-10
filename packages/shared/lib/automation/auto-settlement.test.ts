import { describe, it, expect, vi } from 'vitest'
import { autoReleaseSettlements } from './auto-settlement'

// 회귀 가드: 분쟁 조회 fail-open 차단(커밋 cd6ed3e, 감사 docs/11 P1-15).
// autoReleaseSettlements는 adminClient를 인자로 받는 DI 구조라 fake로 검증 가능.

// 최소 Supabase 쿼리빌더 목: from(table) 체인이 thenable로 결과를 반환.
// settlement은 select/update를 .update() 호출 여부로 구분한다.
function createMockClient(opts: {
  settlements: any[]
  disputes?: any[] | null
  disputeError?: { message: string } | null
  releasedRows?: any[] // settlement update가 반환하는 실제 released 행 (CAS 통과분)
}) {
  const state = { releaseCalled: false, releaseCasEq: [] as string[] }
  const from = (table: string) => {
    let isUpdate = false
    const eqCols: string[] = []
    const chain: any = {
      select: () => chain,
      eq: (col: string) => {
        eqCols.push(col)
        return chain
      },
      lt: () => chain,
      in: () => chain,
      limit: () => chain,
      order: () => chain,
      single: () => chain,
      maybeSingle: () => chain,
      update: () => {
        isUpdate = true
        if (table === 'settlement') state.releaseCalled = true
        return chain
      },
      insert: () => chain,
      then: (resolve: (v: any) => any) => {
        let result: any
        if (table === 'settlement' && !isUpdate) {
          result = { data: opts.settlements, error: null }
        } else if (table === 'settlement' && isUpdate) {
          state.releaseCasEq.push(...eqCols) // settlement update의 eq 컬럼 누적
          result = { data: opts.releasedRows ?? [], error: null }
        } else if (table === 'dispute') {
          result = { data: opts.disputes ?? null, error: opts.disputeError ?? null }
        } else {
          result = { data: [], error: null }
        }
        return Promise.resolve(result).then(resolve)
      },
    }
    return chain
  }
  const rpc = () => Promise.resolve({ error: null })
  return { client: { from, rpc } as any, state }
}

const eligibleSettlement = {
  id: 's1',
  deal_id: 'd1',
  guarantee_fee: 0,
  updated_at: '2020-01-01T00:00:00Z',
  deal: { id: 'd1', status: 'done', expert_id: 'e1', request: { owner_id: 'o1' } },
}

const noopRecalc = vi.fn(async () => ({}))

describe('autoReleaseSettlements — 분쟁 조회 fail-closed', () => {
  it('분쟁 쿼리 에러 시 아무것도 release하지 않는다 (released=0, update 미호출)', async () => {
    const { client, state } = createMockClient({
      settlements: [eligibleSettlement],
      disputes: null,
      disputeError: { message: 'transient DB error' },
    })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await autoReleaseSettlements(client, noopRecalc)

    expect(result.released).toBe(0)
    expect(state.releaseCalled).toBe(false) // release UPDATE가 실행되지 않아야 함
    expect(errSpy).toHaveBeenCalled() // 실패를 로그로 가시화
    errSpy.mockRestore()
  })

  it('open dispute가 있는 정산은 skip된다 (released=0, skipped=1)', async () => {
    const { client, state } = createMockClient({
      settlements: [eligibleSettlement],
      disputes: [{ target_id: 's1' }], // s1에 열린 분쟁
      disputeError: null,
    })

    const result = await autoReleaseSettlements(client, noopRecalc)

    expect(result.released).toBe(0)
    expect(result.skipped).toBe(1)
    expect(state.releaseCalled).toBe(false)
  })

  it('reviewing 정산이 없으면 즉시 종료 (released=0)', async () => {
    const { client } = createMockClient({ settlements: [] })
    const result = await autoReleaseSettlements(client, noopRecalc)
    expect(result.released).toBe(0)
  })
})

describe('autoReleaseSettlements — 배치 release compare-and-set (P1-16)', () => {
  it('release update에 escrow_status CAS 술어가 포함된다', async () => {
    const { client, state } = createMockClient({
      settlements: [eligibleSettlement],
      disputes: [],
      releasedRows: [{ id: 's1' }],
    })
    await autoReleaseSettlements(client, noopRecalc)
    expect(state.releaseCalled).toBe(true)
    expect(state.releaseCasEq).toContain('escrow_status') // .eq('escrow_status','reviewing')
  })

  it('CAS로 0행만 갱신되면(그 사이 전부 refunded) released=0, 후속 처리 없음', async () => {
    const { client } = createMockClient({
      settlements: [eligibleSettlement],
      disputes: [],
      releasedRows: [], // update가 0행 반환 (동시 환불로 escrow_status가 reviewing이 아님)
    })
    const result = await autoReleaseSettlements(client, noopRecalc)
    expect(result.released).toBe(0)
  })

  it('실제 released된 행만 카운트 (released=1)', async () => {
    const { client } = createMockClient({
      settlements: [eligibleSettlement],
      disputes: [],
      releasedRows: [{ id: 's1' }],
    })
    const result = await autoReleaseSettlements(client, noopRecalc)
    expect(result.released).toBe(1)
  })
})
