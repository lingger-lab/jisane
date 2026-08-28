/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase 쿼리빌더 mock은 런타임 shape만 필요 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 회귀 가드: service_order 상태 전이 검증(임의 점프 차단) + CAS(경합 시 409). PART B1.

const mockState = {
  currentStatus: 'pending' as string | null,
  readError: null as { message: string } | null,
  updatedRows: [{ id: 'o1' }] as any[],
  updateError: null as { message: string } | null,
}

vi.mock('@jisane/shared/supabase/admin', () => {
  const from = () => {
    let isUpdate = false
    const chain: any = {
      select: () => chain,
      single: () => chain,
      update: () => {
        isUpdate = true
        return chain
      },
      eq: () => chain,
      then: (resolve: (v: any) => any) => {
        const result = isUpdate
          ? { data: mockState.updatedRows, error: mockState.updateError }
          : mockState.currentStatus === null
            ? { data: null, error: mockState.readError }
            : { data: { status: mockState.currentStatus }, error: null }
        return Promise.resolve(result).then(resolve)
      },
    }
    return chain
  }
  return { adminClient: { from } }
})

vi.mock('@jisane/shared/auth/server-helpers', () => ({
  verifyAdmin: vi.fn(async () => ({ email: 'admin@jisane.cloud' })),
}))

import { PATCH } from './route'

function patch(body: unknown) {
  return new Request('http://localhost/api/admin/service-orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mockState.currentStatus = 'pending'
  mockState.readError = null
  mockState.updatedRows = [{ id: 'o1' }]
  mockState.updateError = null
})

describe('PATCH /api/admin/service-orders — 전이 가드 + CAS', () => {
  it('유효 전이(pending→processing)면 성공', async () => {
    mockState.currentStatus = 'pending'
    const res = await PATCH(patch({ id: 'o1', status: 'processing' }))
    expect(res.status).toBe(200)
  })

  it('임의 점프(pending→completed)는 400으로 차단', async () => {
    mockState.currentStatus = 'pending'
    const res = await PATCH(patch({ id: 'o1', status: 'completed' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('전이 불가')
  })

  it('경합으로 0행이면 409(성공 위조 안 함)', async () => {
    mockState.currentStatus = 'pending'
    mockState.updatedRows = [] // SELECT 이후 다른 전이가 선점
    const res = await PATCH(patch({ id: 'o1', status: 'processing' }))
    expect(res.status).toBe(409)
  })

  it('주문 없음이면 404', async () => {
    mockState.currentStatus = null
    const res = await PATCH(patch({ id: 'nope', status: 'processing' }))
    expect(res.status).toBe(404)
  })

  it('허용되지 않은 상태값은 400', async () => {
    const res = await PATCH(patch({ id: 'o1', status: 'bogus' }))
    expect(res.status).toBe(400)
  })

  it('id/status 누락은 400', async () => {
    const res = await PATCH(patch({ id: 'o1' }))
    expect(res.status).toBe(400)
  })
})
