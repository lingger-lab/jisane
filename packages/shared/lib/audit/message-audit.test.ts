/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase mock은 런타임 shape만 필요 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// message-audit.ts는 'server-only'를 import → vitest(비 RSC)에서 throw하므로 무력화
vi.mock('server-only', () => ({}))

const mockState = {
  inserts: [] as { table: string; payload: any }[],
  insertError: null as { message: string } | null,
}

vi.mock('../supabase/admin', () => ({
  adminClient: {
    from: (table: string) => ({
      insert: (payload: any) => {
        mockState.inserts.push({ table, payload })
        return Promise.resolve({ error: mockState.insertError })
      },
    }),
  },
}))

import { flagIfRisky } from './message-audit'

beforeEach(() => {
  mockState.inserts = []
  mockState.insertError = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('flagIfRisky', () => {
  it('위험 메시지 → message_audit에 unreviewed·auto_flagged로 insert', async () => {
    await flagIfRisky('deal', 'm1', '010-1234-5678 로 연락주세요')
    expect(mockState.inserts).toHaveLength(1)
    const { table, payload } = mockState.inserts[0]
    expect(table).toBe('message_audit')
    expect(payload.channel).toBe('deal')
    expect(payload.message_id).toBe('m1')
    expect(payload.status).toBe('unreviewed')
    expect(payload.auto_flagged).toBe(true)
    expect(payload.flagged_reasons).toContain('phone')
  })

  it('정상 메시지 → insert 안 함(행 없음)', async () => {
    await flagIfRisky('service_order', 'm2', '견적서 전달드립니다. 확인 부탁드려요.')
    expect(mockState.inserts).toHaveLength(0)
  })

  it('insert 실패해도 throw 안 함(fire-and-forget — 전송을 막지 않음)', async () => {
    mockState.insertError = { message: 'db down' }
    await expect(flagIfRisky('deal', 'm3', '카톡 아이디 abc')).resolves.toBeUndefined()
  })
})
