/**
 * 전문가 스코어링 모듈
 *
 * 종합점수 = (경력점수 × 1 + 리뷰점수 × 2 + 완료율점수 × 1) ÷ 4
 *
 * - 경력점수: 가입 시 확정, career_years 기반 (1~5)
 * - 리뷰점수: 기업 별점 평균, 0건이면 기본 3.0
 * - 완료율점수: done/accepted 비율 × 5, 0건이면 기본 3.0
 * - total_score: DB GENERATED ALWAYS AS — career_score/review_score/completion_score 업데이트 시 자동 계산
 */

const DEFAULT_SCORE = 3.0

/** 경력점수 산정 (career_years → 1~5) */
export function computeCareerScore(careerYears: number | null): number {
  if (!careerYears || careerYears <= 0) return 1.0
  if (careerYears >= 30) return 5.0
  if (careerYears >= 20) return 4.0
  if (careerYears >= 10) return 3.0
  if (careerYears >= 5) return 2.0
  return 1.0
}

/** 리뷰점수 산정 (기업 별점 평균, 0건이면 기본 3.0) */
export function computeReviewScore(
  reviews: Array<{ rating: number }>
): number {
  if (reviews.length === 0) return DEFAULT_SCORE
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

/** 완료율점수 산정 (done 비율 × 5, 0건이면 기본 3.0) */
export function computeCompletionScore(
  doneCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return DEFAULT_SCORE
  const rate = doneCount / totalCount
  return Math.round(rate * 5 * 10) / 10
}

/**
 * Supabase adminClient로 전문가의 review_score + completion_score를 재계산하여 업데이트
 * (career_score는 프로필 등록/수정 시에만 변경)
 * total_score는 DB GENERATED column이므로 자동 반영됨
 */
export async function recalcExpertScores(
  adminClient: { from: (table: string) => any },
  expertId: string
): Promise<{ review_score: number; completion_score: number } | null> {
  // 1. 확정된 리뷰 (author_type = 'owner') 조회
  const { data: reviews } = await adminClient
    .from('review')
    .select('rating')
    .eq('expert_id', expertId)
    .eq('author_type', 'owner')

  // 2. 거래 현황 조회 (done / cancelled 제외한 전체)
  const { data: deals } = await adminClient
    .from('deal')
    .select('status')
    .eq('expert_id', expertId)

  const reviewScore = computeReviewScore(reviews ?? [])
  const doneCount = (deals ?? []).filter((d: { status: string }) => d.status === 'done').length
  const totalCount = (deals ?? []).filter(
    (d: { status: string }) => d.status !== 'cancelled'
  ).length
  const completionScore = computeCompletionScore(doneCount, totalCount)

  // 3. 신규자 판정 (리뷰 3건 미만 = 신규자)
  const isNewbie = (reviews ?? []).length < 3

  // 4. expert 테이블 업데이트
  const { error } = await adminClient
    .from('expert')
    .update({ review_score: reviewScore, completion_score: completionScore, is_newbie: isNewbie })
    .eq('id', expertId)

  if (error) return null
  return { review_score: reviewScore, completion_score: completionScore }
}

/**
 * 여러 전문가의 스코어를 배치로 재계산 (N+1 → 2+N 쿼리)
 * review와 deal을 일괄 조회한 뒤 expert별로 분류하여 업데이트
 */
export async function batchRecalcExpertScores(
  adminClient: { from: (table: string) => any },
  expertIds: string[]
): Promise<number> {
  if (expertIds.length === 0) return 0

  // 1. 리뷰 + 거래 일괄 조회 (2쿼리)
  const [{ data: allReviews }, { data: allDeals }] = await Promise.all([
    adminClient
      .from('review')
      .select('expert_id, rating')
      .in('expert_id', expertIds)
      .eq('author_type', 'owner'),
    adminClient
      .from('deal')
      .select('expert_id, status')
      .in('expert_id', expertIds),
  ])

  // 2. expert별 그룹핑
  const reviewsByExpert = new Map<string, Array<{ rating: number }>>()
  const dealsByExpert = new Map<string, Array<{ status: string }>>()
  for (const id of expertIds) {
    reviewsByExpert.set(id, [])
    dealsByExpert.set(id, [])
  }
  for (const r of allReviews ?? []) {
    reviewsByExpert.get(r.expert_id)?.push({ rating: r.rating })
  }
  for (const d of allDeals ?? []) {
    dealsByExpert.get(d.expert_id)?.push({ status: d.status })
  }

  // 3. 개별 expert 업데이트 (Supabase는 조건부 일괄 update 미지원 → N쿼리)
  let updated = 0
  for (const id of expertIds) {
    const reviews = reviewsByExpert.get(id) ?? []
    const deals = dealsByExpert.get(id) ?? []
    const reviewScore = computeReviewScore(reviews)
    const doneCount = deals.filter((d) => d.status === 'done').length
    const totalCount = deals.filter((d) => d.status !== 'cancelled').length
    const completionScore = computeCompletionScore(doneCount, totalCount)
    const isNewbie = reviews.length < 3

    const { error } = await adminClient
      .from('expert')
      .update({ review_score: reviewScore, completion_score: completionScore, is_newbie: isNewbie })
      .eq('id', id)

    if (error) {
      console.warn(`[expert-scoring] update failed for expert ${id}:`, error.message)
    } else {
      updated++
    }
  }

  if (updated < expertIds.length) {
    console.warn(`[expert-scoring] batch recalc partial: ${updated}/${expertIds.length} succeeded`)
  }

  return updated
}
