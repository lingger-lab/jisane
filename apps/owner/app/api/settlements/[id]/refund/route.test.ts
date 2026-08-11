/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase 쿼리빌더 mock은 런타임 shape만 필요 (기존 shared 테스트 패턴) */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 회귀 가드: payment_key 없는 settlement에 Toss 취소 없이 refunded를 기록하는
// 가짜 환불 차단(감사 docs/11 P3-84) + 환불 금액 정수 경계검증(P3-85).

const mockState = {
  settlement: null as any,
  settlementUpdateCalled: false,
  cancelCalls: [] as any[],
}

vi.mock('@jisane/shared/supabase/admin', () => {
  const from = (table: string) => {
    let isUpdate = false
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      single: () => chain,
      insert: () => chain,
      update: () => {
        isUpdate = true
        if (table === 'settlement') mockState.settlementUpdateCalled = true
        return chain
      },
      then: (resolve: (v: any) => any) => {
        let result: any
        if (table === 'settlement' && !isUpdate) {
          result = { data: mockState.settlement, error: null }
        } else if (table === 'deal') {
          result = { data: { expert_id: 'e1', expert: { is_newbie: false } }, error: null }
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

vi.mock('@jisane/shared/payment', () => ({
  cancelPayment: vi.fn(async (...args: any[]) => {
    mockState.cancelCalls.push(args)
    return { success: true }
  }),
}))

import { POST } from './route'

const SECRET = 'test-admin-secret'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/settlements/s1/refund', {
    method: 'POST',
    headers: { 'x-admin-secret': SECRET, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const props = { params: Promise.resolve({ id: 's1' }) }

beforeEach(() => {
  process.env.ADMIN_SECRET = SECRET
  mockState.settlementUpdateCalled = false
  mockState.cancelCalls = []
  mockState.settlement = {
    id: 's1',
    deal_id: 'd1',
    escrow_status: 'deposited',
    payment_key: 'pk_1',
    refunded_amt: 0,
    guarantee_fee: 0,
    deal: { total_pay: 100000 },
  }
})

describe('refund — payment_key 없는 가짜 환불 차단 (P3-84)', () => {
  it('payment_key null이면 409로 거부하고 취소·DB 갱신 모두 실행하지 않는다', async () => {
    mockState.settlement.payment_key = null
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await POST(makeRequest({ amount: 10000, reason: '고객 요청' }), props)

    expect(res.status).toBe(409)
    expect(mockState.cancelCalls.length).toBe(0)
    expect(mockState.settlementUpdateCalled).toBe(false) // refunded 기록 금지
    errSpy.mockRestore()
  })

  it('payment_key가 있으면 Toss 취소 후 정상 처리한다', async () => {
    const res = await POST(makeRequest({ amount: 10000, reason: '고객 요청' }), props)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(mockState.cancelCalls.length).toBe(1)
    expect(mockState.settlementUpdateCalled).toBe(true)
  })
})

describe('refund — 금액 경계검증 (P3-85)', () => {
  it.each([
    ['float', 100.5],
    ['문자열', 'abc'],
    ['0', 0],
    ['음수', -1000],
  ])('%s 금액은 400으로 거부한다', async (_label, amount) => {
    const res = await POST(makeRequest({ amount, reason: '사유' }), props)

    expect(res.status).toBe(400)
    expect(mockState.cancelCalls.length).toBe(0)
    expect(mockState.settlementUpdateCalled).toBe(false)
  })
})
