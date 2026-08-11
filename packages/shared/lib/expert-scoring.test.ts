import { describe, it, expect } from 'vitest'
import {
  computeCareerScore,
  computeReviewScore,
  computeCompletionScore,
  computeExpertScoreFields,
  recalcExpertScores,
  batchRecalcExpertScores,
} from './expert-scoring'

// 점수계산 단일소스화(감사 docs/11 P3-101) 고정 테스트.
// 단건(recalcExpertScores)·배치(batchRecalcExpertScores) 경로가 따로 들고 있던
// 파생식을 computeExpertScoreFields로 합치면서 값이 1비트도 달라지지 않았음을 보증하고,
// 두 경로가 같은 입력에 같은 update payload를 쓰는지 상호 동등성을 고정한다.

describe('computeExpertScoreFields — 교체 전 파생식과의 값 동일성', () => {
  it('리뷰·거래 0건이면 기본 3.0/3.0, 신규자', () => {
    expect(computeExpertScoreFields([], [])).toEqual({
      review_score: 3.0,
      completion_score: 3.0,
      is_newbie: true,
    })
  })

  it('리뷰 평균은 소수 1자리 반올림, 완료율은 done/(cancelled 제외)×5', () => {
    const reviews = [{ rating: 5 }, { rating: 4 }, { rating: 4 }]
    const deals = [
      { status: 'done' },
      { status: 'done' },
      { status: 'working' },
      { status: 'cancelled' }, // 분모 제외
    ]
    expect(computeExpertScoreFields(reviews, deals)).toEqual({
      review_score: 4.3, // (5+4+4)/3 = 4.333… → 4.3
      completion_score: 3.3, // 2/3 × 5 = 3.333… → 3.3
      is_newbie: false, // 리뷰 3건 이상
    })
  })

  it('리뷰 2건이면 신규자(3건 미만)', () => {
    const r = computeExpertScoreFields([{ rating: 5 }, { rating: 5 }], [{ status: 'done' }])
    expect(r.is_newbie).toBe(true)
    expect(r.completion_score).toBe(5.0)
  })

  it('순수 함수 3종 값 고정 (경계값)', () => {
    expect(computeCareerScore(null)).toBe(1.0)
    expect(computeCareerScore(4)).toBe(1.0)
    expect(computeCareerScore(5)).toBe(2.0)
    expect(computeCareerScore(10)).toBe(3.0)
    expect(computeCareerScore(20)).toBe(4.0)
    expect(computeCareerScore(30)).toBe(5.0)
    expect(computeReviewScore([])).toBe(3.0)
    expect(computeCompletionScore(0, 0)).toBe(3.0)
    expect(computeCompletionScore(1, 2)).toBe(2.5)
  })
})

// ---- 단건 vs 배치 경로 동등성 ----

/** 최소 thenable 쿼리 빌더 — 어떤 체인 메서드를 호출해도 자신을 반환하고 result로 resolve */
function makeBuilder(result: unknown, onUpdate?: (payload: unknown) => void) {
  const builder: Record<string, unknown> = {}
  const chain = (..._args: unknown[]) => builder
  for (const m of ['select', 'eq', 'in', 'order', 'single']) builder[m] = chain
  builder.update = (payload: unknown) => {
    onUpdate?.(payload)
    return builder
  }
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return builder
}

describe('recalcExpertScores ↔ batchRecalcExpertScores — 같은 입력, 같은 update payload', () => {
  const expertId = 'e-1'
  const reviews = [{ rating: 5 }, { rating: 3 }]
  const deals = [{ status: 'done' }, { status: 'working' }, { status: 'cancelled' }]

  it('두 경로가 동일한 expert update payload를 쓴다', async () => {
    // 단건 경로
    const singlePayloads: unknown[] = []
    const singleClient = {
      from: (table: string) => {
        if (table === 'review') return makeBuilder({ data: reviews })
        if (table === 'deal') return makeBuilder({ data: deals })
        return makeBuilder({ error: null }, (p) => singlePayloads.push(p))
      },
    }
    const singleResult = await recalcExpertScores(singleClient, expertId)

    // 배치 경로 (같은 데이터에 expert_id를 붙여 일괄 조회 형태로 공급)
    const batchPayloads: unknown[] = []
    const batchClient = {
      from: (table: string) => {
        if (table === 'review')
          return makeBuilder({ data: reviews.map((r) => ({ expert_id: expertId, ...r })) })
        if (table === 'deal')
          return makeBuilder({ data: deals.map((d) => ({ expert_id: expertId, ...d })) })
        return makeBuilder({ error: null }, (p) => batchPayloads.push(p))
      },
    }
    const updated = await batchRecalcExpertScores(batchClient, [expertId])

    expect(singlePayloads).toHaveLength(1)
    expect(batchPayloads).toHaveLength(1)
    expect(singlePayloads[0]).toEqual(batchPayloads[0])
    // 값 자체도 고정: (5+3)/2=4.0, done 1 / (3-1)=2 → 2.5, 리뷰 2건 → 신규자
    expect(singlePayloads[0]).toEqual({
      review_score: 4.0,
      completion_score: 2.5,
      is_newbie: true,
    })
    expect(singleResult).toEqual({ review_score: 4.0, completion_score: 2.5 })
    expect(updated).toBe(1)
  })
})
