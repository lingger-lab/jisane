import { describe, it, expect, vi, beforeEach } from 'vitest'

// 회귀 가드: deal 상태 전이 CAS(감사 docs/11 P2-58).
// SELECT-then-UPDATE 사이에 상태가 바뀐 경쟁 전이(취소·중복 제출)를 덮어쓰지 않고,
// UPDATE에 기대상태 predicate + 0행 실패 처리가 있는지 고정한다.

const mockState = {
  dealUpdateEqs: [] as Array<{ col: string; val: unknown }>,
  dealUpdatedRows: [] as any[],
  settlementStatus: 'deposited' as string,
  settlementUpdateError: null as { message: string } | null,
}

vi.mock('../supabase/admin', () => {
  const from = (table: string) => {
    let isUpdate = false
    const eqs: Array<{ col: string; val: unknown }> = []
    const chain: any = {
      select: () => chain,
      single: () => chain,
      eq: (col: string, val: unknown) => {
        eqs.push({ col, val })
        return chain
      },
      update: () => {
        isUpdate = true
        return chain
      },
      then: (resolve: (v: any) => any) => {
        let result: any
        if (table === 'deal' && isUpdate) {
          mockState.dealUpdateEqs = eqs
          result = { data: mockState.dealUpdatedRows, error: null }
        } else if (table === 'settlement' && !isUpdate) {
          result = { data: { escrow_status: mockState.settlementStatus }, error: null }
        } else if (table === 'settlement' && isUpdate) {
          result = { data: null, error: mockState.settlementUpdateError }
        } else {
          result = { data: null, error: null }
        }
        return Promise.resolve(result).then(resolve)
      },
    }
    return chain
  }
  return { adminClient: { from } }
})

vi.mock('../auth/server-helpers', () => ({
  getAuthUserId: vi.fn(async () => 'auth-user-1'),
  verifyDealOwnership: vi.fn(),
}))

import { approveDealOp, confirmDealOp } from './deal-operations'
import { verifyDealOwnership } from '../auth/server-helpers'

function setOwnership(status: string) {
  vi.mocked(verifyDealOwnership).mockResolvedValue({
    deal: { id: 'd1', status },
    requestId: 'r1',
    ownerId: 'o1',
  } as any)
}

beforeEach(() => {
  mockState.dealUpdateEqs = []
  mockState.dealUpdatedRows = []
  mockState.settlementStatus = 'deposited'
  mockState.settlementUpdateError = null
})

describe('approveDealOp — quoted→working CAS', () => {
  it('UPDATE에 status=quoted predicate가 붙는다', async () => {
    setOwnership('quoted')
    mockState.dealUpdatedRows = [{ id: 'd1' }]

    const result = await approveDealOp('d1')

    expect(result).toEqual({ requestId: 'r1' })
    expect(mockState.dealUpdateEqs).toContainEqual({ col: 'status', val: 'quoted' })
  })

  it('0행 매칭(경쟁 전이로 상태 변경)이면 성공을 위조하지 않고 에러를 반환한다', async () => {
    setOwnership('quoted')
    mockState.dealUpdatedRows = [] // SELECT 이후 다른 전이가 선점

    const result = await approveDealOp('d1')

    expect(result.error).toBe('승인할 수 없는 상태입니다.')
    expect(result.requestId).toBeUndefined()
  })
})

describe('confirmDealOp — working→done CAS', () => {
  it('UPDATE에 status=working predicate가 붙고 정상 경로는 requestId를 반환한다', async () => {
    setOwnership('working')
    mockState.dealUpdatedRows = [{ id: 'd1' }]

    const result = await confirmDealOp('d1')

    expect(result).toEqual({ requestId: 'r1' })
    expect(mockState.dealUpdateEqs).toContainEqual({ col: 'status', val: 'working' })
  })

  it('0행 매칭이면 에러를 반환한다', async () => {
    setOwnership('working')
    mockState.dealUpdatedRows = []

    const result = await confirmDealOp('d1')

    expect(result.error).toBe('검수할 수 없는 상태입니다.')
  })
})
