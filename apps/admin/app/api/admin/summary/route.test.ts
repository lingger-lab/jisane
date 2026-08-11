/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase 쿼리빌더 mock은 런타임 shape만 필요 (기존 refund route 테스트 패턴) */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 회귀 가드(감사 docs/10 P2-10): 요약 지표 쿼리 실패가 "전부 0"이라는
// 그럴듯한 거짓 200으로 격하되지 않고 500으로 표면화되는지 — 에러 주입 테스트.

const mockState = {
  failTable: null as string | null,
}

vi.mock('@jisane/shared/supabase/admin', () => {
  const from = (table: string) => {
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      then: (resolve: (v: any) => any) => {
        const fail = mockState.failTable === table
        const result = fail
          ? { data: null, count: null, error: { message: 'injected failure' } }
          : table === 'guarantee_fund_ledger'
            ? { data: [{ amount: 1000 }], count: null, error: null }
            : { data: null, count: 2, error: null }
        return Promise.resolve(result).then(resolve)
      },
    }
    return chain
  }
  return { adminClient: { from } }
})

import { GET } from './route'

const SECRET = 'test-admin-secret'

function makeRequest() {
  return new Request('http://localhost/api/admin/summary', {
    headers: { 'x-admin-secret': SECRET },
  })
}

beforeEach(() => {
  process.env.ADMIN_SECRET = SECRET
  mockState.failTable = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('admin summary — 쿼리 실패 fail-loud (P2-10)', () => {
  it('정상 조회면 200과 실제 지표를 반환한다', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.matchingWaiting).toBe(2)
    expect(body.inProgress).toBe(2)
    expect(body.guaranteeFundBalance).toBe(0) // accrue 1000 - payout 1000
  })

  it('카운트 쿼리 실패 시 가짜 0 대신 500을 반환한다', async () => {
    mockState.failTable = 'request'
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
    expect(body.matchingWaiting).toBeUndefined()
  })

  it('원장 쿼리 실패 시에도 500을 반환한다', async () => {
    mockState.failTable = 'guarantee_fund_ledger'
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })
})
