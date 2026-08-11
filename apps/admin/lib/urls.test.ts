import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// URL 폴백 단일화(감사 docs/11 P3-17) 값 고정 — 산재하던
// `process.env.NEXT_PUBLIC_* || '리터럴'`과 1비트도 다르지 않음을 보증한다.

beforeEach(() => vi.resetModules())
afterEach(() => vi.unstubAllEnvs())

describe('admin app URL 단일 소스 — P3-17 교체 전후 값 동일성', () => {
  it('env 미설정이면 기존 프로덕션 폴백과 동일하다', async () => {
    vi.stubEnv('NEXT_PUBLIC_OWNER_URL', '')
    vi.stubEnv('NEXT_PUBLIC_EXPERT_URL', '')
    const m = await import('./urls')
    expect(m.OWNER_URL).toBe('https://owner.jisane.cloud')
    expect(m.EXPERT_URL).toBe('https://expert.jisane.cloud')
  })

  it('env가 설정되면 env 값이 우선한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_OWNER_URL', 'https://owner.staging.example')
    vi.stubEnv('NEXT_PUBLIC_EXPERT_URL', 'https://expert.staging.example')
    const m = await import('./urls')
    expect(m.OWNER_URL).toBe('https://owner.staging.example')
    expect(m.EXPERT_URL).toBe('https://expert.staging.example')
  })
})
