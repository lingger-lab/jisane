import { describe, it, expect, vi } from 'vitest'
import { recalcActivityPoints } from './expert-activity'

// 회귀 가드: recalc의 select 실패가 0 합산으로 이어져 실제 activity_points를
// 0으로 덮어쓰는 결함 차단(감사 docs/11 P2-11).

function createMockClient(opts: {
  activities?: any[] | null
  selectError?: { message: string } | null
  updateError?: { message: string } | null
}) {
  const state = { updateCalled: false, updatedValue: null as number | null }
  const from = (table: string) => {
    let isUpdate = false
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      update: (payload: { activity_points: number }) => {
        isUpdate = true
        if (table === 'expert') {
          state.updateCalled = true
          state.updatedValue = payload.activity_points
        }
        return chain
      },
      then: (resolve: (v: any) => any) => {
        let result: any
        if (table === 'expert_activity' && !isUpdate) {
          result = { data: opts.activities ?? null, error: opts.selectError ?? null }
        } else if (table === 'expert' && isUpdate) {
          result = { data: null, error: opts.updateError ?? null }
        } else {
          result = { data: null, error: null }
        }
        return Promise.resolve(result).then(resolve)
      },
    }
    return chain
  }
  return { client: { from } as any, state }
}

const future = new Date(Date.now() + 86400000).toISOString()
const past = new Date(Date.now() - 86400000).toISOString()

describe('recalcActivityPoints — 실패 read로 0 덮어쓰기 금지', () => {
  it('select 에러 시 { error }를 반환하고 expert를 갱신하지 않는다', async () => {
    const { client, state } = createMockClient({ selectError: { message: 'transient' } })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await recalcActivityPoints(client, 'e1')

    expect('error' in result).toBe(true)
    expect(state.updateCalled).toBe(false) // 0으로 덮어쓰면 안 됨
    errSpy.mockRestore()
  })

  it('update 에러 시 { error }를 반환한다 (조용한 성공 금지)', async () => {
    const { client } = createMockClient({
      activities: [{ points: 1.0, expires_at: future }],
      updateError: { message: 'write failed' },
    })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await recalcActivityPoints(client, 'e1')

    expect('error' in result).toBe(true)
    errSpy.mockRestore()
  })

  it('정상 경로: 만료 제외·상한 2.0 합산을 반영한다', async () => {
    const { client, state } = createMockClient({
      activities: [
        { points: 1.0, expires_at: future },
        { points: 0.5, expires_at: future },
        { points: 1.0, expires_at: future }, // 합 2.5 → 상한 2.0
        { points: 1.0, expires_at: past }, // 만료 — 제외
      ],
    })

    const result = await recalcActivityPoints(client, 'e1')

    expect(result).toEqual({ points: 2.0 })
    expect(state.updateCalled).toBe(true)
    expect(state.updatedValue).toBe(2.0)
  })
})
