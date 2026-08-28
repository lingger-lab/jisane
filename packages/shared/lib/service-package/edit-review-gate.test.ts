import { describe, it, expect, vi } from 'vitest'
import { applyPackageEdit, type PackageEditFields } from './edit-review-gate'

// 회귀 가드: published 패키지의 파트너 편집이 관리자 재검수 게이트를 우회하던 문제
// (감사 docs/11 P2-15). auto-settlement.test.ts의 최소 Supabase 쿼리빌더 목 패턴 준용.

const fields: PackageEditFields = {
  name: '수정된 서비스',
  description: '수정된 설명',
  price: 300000,
  is_free: false,
  deliverables: ['리포트'],
  duration: '1주',
  value_desc: '가치 설명',
  banner_url: null,
}

interface MockResult {
  data: unknown
  error: { message: string; code?: string } | null
}

interface MockChain {
  select: () => MockChain
  eq: (col: string, val: unknown) => MockChain
  single: () => MockChain
  update: (payload: Record<string, unknown>) => MockChain
  then: (resolve: (v: MockResult) => unknown) => Promise<unknown>
}

function createMockClient(opts: {
  currentStatus: string | null // null → 소유 패키지 없음 (PGRST116)
  selectError?: { message: string; code?: string } | null // 0행이 아닌 실제 조회 실패
  updatedRows?: Array<{ id: string }> | null // update .select('id')가 반환할 행 (기본: 1행 성공)
  updateError?: { message: string } | null
}) {
  const state = {
    updatePayload: null as Record<string, unknown> | null,
    updateEqArgs: [] as Array<[string, unknown]>,
  }
  const from = () => {
    let isUpdate = false
    const eqArgs: Array<[string, unknown]> = []
    const chain: MockChain = {
      select: () => chain,
      eq: (col, val) => {
        eqArgs.push([col, val])
        return chain
      },
      single: () => chain,
      update: (payload) => {
        isUpdate = true
        state.updatePayload = payload
        return chain
      },
      then: (resolve) => {
        let result: MockResult
        if (isUpdate) {
          state.updateEqArgs = eqArgs
          result = opts.updateError
            ? { data: null, error: opts.updateError }
            : { data: opts.updatedRows === undefined ? [{ id: 'p1' }] : opts.updatedRows, error: null }
        } else if (opts.selectError) {
          result = { data: null, error: opts.selectError }
        } else {
          result = opts.currentStatus
            ? { data: { id: 'p1', status: opts.currentStatus }, error: null }
            : { data: null, error: { message: 'not found', code: 'PGRST116' } }
        }
        return Promise.resolve(resolve(result))
      },
    }
    return chain
  }
  return { client: { from }, state }
}

const params = { packageId: 'p1', providerId: 'prov1', fields }

describe('applyPackageEdit — published 편집 시 재검수 회귀 (P2-15)', () => {
  it('published 패키지 편집은 status를 draft로 되돌린다 (재검수 큐 재진입)', async () => {
    const { client, state } = createMockClient({ currentStatus: 'published' })

    const result = await applyPackageEdit(client, params)

    expect(result).toEqual({ ok: true, sentBackToReview: true })
    expect(state.updatePayload?.status).toBe('draft')
  })

  it('published 편집 update는 읽은 status를 CAS 술어로 포함한다', async () => {
    const { client, state } = createMockClient({ currentStatus: 'published' })

    await applyPackageEdit(client, params)

    expect(state.updateEqArgs).toContainEqual(['status', 'published'])
    expect(state.updateEqArgs).toContainEqual(['provider_id', 'prov1'])
  })

  it('draft 패키지 편집은 status를 건드리지 않는다 (정상 경로 불변)', async () => {
    const { client, state } = createMockClient({ currentStatus: 'draft' })

    const result = await applyPackageEdit(client, params)

    expect(result).toEqual({ ok: true, sentBackToReview: false })
    expect(state.updatePayload).not.toHaveProperty('status')
    expect(state.updateEqArgs).toContainEqual(['status', 'draft'])
  })

  it('archived 패키지 편집도 status를 유지한다', async () => {
    const { client, state } = createMockClient({ currentStatus: 'archived' })

    const result = await applyPackageEdit(client, params)

    expect(result).toEqual({ ok: true, sentBackToReview: false })
    expect(state.updatePayload).not.toHaveProperty('status')
  })

  it('소유 패키지가 없으면 not_found (update 미실행)', async () => {
    const { client, state } = createMockClient({ currentStatus: null })

    const result = await applyPackageEdit(client, params)

    expect(result).toEqual({ ok: false, reason: 'not_found' })
    expect(state.updatePayload).toBeNull()
  })

  it('CAS 경쟁 패배(0행 갱신)면 conflict — 관리자 전환을 clobber하지 않는다', async () => {
    const { client } = createMockClient({ currentStatus: 'published', updatedRows: [] })

    const result = await applyPackageEdit(client, params)

    expect(result).toEqual({ ok: false, reason: 'conflict' })
  })

  it('소유권 조회의 실제 DB 오류는 not_found로 위장하지 않고 db_error (update 미실행)', async () => {
    const { client, state } = createMockClient({
      currentStatus: null,
      selectError: { message: 'transient', code: '57014' },
    })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await applyPackageEdit(client, params)

    expect(result).toEqual({ ok: false, reason: 'db_error' })
    expect(state.updatePayload).toBeNull()
    errSpy.mockRestore()
  })

  it('update 에러는 db_error로 fail-closed', async () => {
    const { client } = createMockClient({
      currentStatus: 'published',
      updateError: { message: 'boom' },
    })

    const result = await applyPackageEdit(client, params)

    expect(result).toEqual({ ok: false, reason: 'db_error' })
  })
})
