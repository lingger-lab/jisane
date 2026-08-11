import { describe, it, expect, vi, beforeEach } from 'vitest'

// 회귀 가드: resolveExpertFromAuth 추출(감사 docs/11 P3-69, 6곳 중복 제거).
// 인증 사용자 → expert 행 해석이 사본들과 동일하게 동작하는지 고정한다:
// 미인증이면 expert 조회 없이 null 쌍, 인증이면 columns대로 select + auth_user_id 매칭.

const mockState = {
  user: null as { id: string } | null,
  expertRow: null as Record<string, unknown> | null,
  fromCalls: [] as string[],
  selectedColumns: null as string | null,
  eqArgs: null as null | { col: string; val: unknown },
}

vi.mock('next/headers', () => ({
  cookies: async () => ({}),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('../supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: mockState.user } }),
    },
  }),
}))

vi.mock('../supabase/admin', () => ({
  adminClient: {
    from: (table: string) => {
      mockState.fromCalls.push(table)
      const chain = {
        select: (columns: string) => {
          mockState.selectedColumns = columns
          return chain
        },
        eq: (col: string, val: unknown) => {
          mockState.eqArgs = { col, val }
          return chain
        },
        single: async () => ({ data: mockState.expertRow, error: null }),
      }
      return chain
    },
  },
}))

import { resolveExpertFromAuth } from './server-helpers'

beforeEach(() => {
  mockState.user = null
  mockState.expertRow = null
  mockState.fromCalls = []
  mockState.selectedColumns = null
  mockState.eqArgs = null
})

describe('resolveExpertFromAuth', () => {
  it('미인증이면 expert 조회 없이 { user: null, expert: null }을 반환한다', async () => {
    const result = await resolveExpertFromAuth()

    expect(result).toEqual({ user: null, expert: null })
    expect(mockState.fromCalls).toEqual([])
  })

  it('인증 사용자면 기본 columns(id)로 expert를 auth_user_id로 조회해 반환한다', async () => {
    mockState.user = { id: 'auth-1' }
    mockState.expertRow = { id: 'expert-1' }

    const result = await resolveExpertFromAuth()

    expect(mockState.fromCalls).toEqual(['expert'])
    expect(mockState.selectedColumns).toBe('id')
    expect(mockState.eqArgs).toEqual({ col: 'auth_user_id', val: 'auth-1' })
    expect(result.user).toEqual({ id: 'auth-1' })
    expect(result.expert).toEqual({ id: 'expert-1' })
  })

  it('columns 인자를 select에 그대로 전달한다', async () => {
    mockState.user = { id: 'auth-1' }
    mockState.expertRow = { id: 'expert-1', hourly_rate: 50000, name: '홍길동' }

    const result = await resolveExpertFromAuth<{
      id: string
      hourly_rate: number | null
      name: string
    }>('id, hourly_rate, name')

    expect(mockState.selectedColumns).toBe('id, hourly_rate, name')
    expect(result.expert).toEqual({ id: 'expert-1', hourly_rate: 50000, name: '홍길동' })
  })

  it('expert 행이 없으면 { user, expert: null }을 반환한다 (실패 정책은 호출부 소관)', async () => {
    mockState.user = { id: 'auth-1' }
    mockState.expertRow = null

    const result = await resolveExpertFromAuth()

    expect(result.user).toEqual({ id: 'auth-1' })
    expect(result.expert).toBeNull()
  })
})
