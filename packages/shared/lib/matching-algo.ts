import type { PartnerRow } from './types'
import type { CategoryRow } from './categories'

export interface ScoredPartner {
  partner: PartnerRow
  score: number
  scoreDetail: {
    category: number
    keyword: number
    career: number
    interest: number
    rating: number
    track: number
  }
}

interface RequestInput {
  title: string
  detail: string
  req_type: string | null
  category_id: string | null
}

interface MatchingContext {
  categories: CategoryRow[]
  partnerCategories: Array<{ partner_id: string; category_id: string }>
  interests: Array<{ partner_id: string }>
  partnerStats: Array<{ partner_id: string; avg_rating: number; deal_count: number }>
}

/**
 * AI 매칭 알고리즘 — 카테고리 + 키워드 + 실적 기반 후보 추천
 *
 * 점수 기준:
 * - 카테고리 일치 (중분류): +15
 * - 카테고리 일치 (대분류): +8
 * - 키워드 매칭: +3/개
 * - 경력 보너스: min(career_yrs, 10)
 * - 관심 표현 보너스: +10
 * - 과거 평점 보너스: +1~5
 * - 완료 거래 실적: +2/건 (max 10)
 *
 * 상위 3명 반환
 */
export function findCandidates(
  request: RequestInput,
  partners: PartnerRow[],
  context?: MatchingContext,
  maxResults = 3
): ScoredPartner[] {
  const categoryMap = new Map<string, CategoryRow>()
  if (context?.categories) {
    for (const c of context.categories) categoryMap.set(c.id, c)
  }

  // 의뢰 카테고리의 중분류/대분류 ID 찾기
  let reqMidId: string | null = null
  let reqMajorId: string | null = null
  if (request.category_id && categoryMap.size > 0) {
    const cat = categoryMap.get(request.category_id)
    if (cat) {
      if (cat.depth === 2 && cat.parent_id) {
        reqMidId = cat.parent_id
        const mid = categoryMap.get(cat.parent_id)
        reqMajorId = mid?.parent_id || null
      } else if (cat.depth === 1) {
        reqMidId = cat.id
        reqMajorId = cat.parent_id
      } else if (cat.depth === 0) {
        reqMajorId = cat.id
      }
    }
  }

  // 파트너별 카테고리 Set
  const partnerCatMap = new Map<string, Set<string>>()
  if (context?.partnerCategories) {
    for (const pc of context.partnerCategories) {
      if (!partnerCatMap.has(pc.partner_id)) {
        partnerCatMap.set(pc.partner_id, new Set())
      }
      partnerCatMap.get(pc.partner_id)!.add(pc.category_id)
    }
  }

  // 관심 표현 Set
  const interestSet = new Set(context?.interests?.map((i) => i.partner_id) || [])

  // 파트너별 실적 Map
  const statsMap = new Map<string, { avg_rating: number; deal_count: number }>()
  if (context?.partnerStats) {
    for (const s of context.partnerStats) statsMap.set(s.partner_id, s)
  }

  const scored: ScoredPartner[] = partners
    .filter((p) => p.status === 'active')
    .map((partner) => {
      let categoryScore = 0
      let keywordScore = 0
      let careerScore = 0
      let interestScore = 0
      let ratingScore = 0
      let trackScore = 0

      // 1. 카테고리 매칭 (새 partner_category 테이블 기반)
      const pCats = partnerCatMap.get(partner.id)
      if (pCats && reqMidId) {
        if (pCats.has(reqMidId)) {
          categoryScore = 15 // 중분류 일치
        } else if (reqMajorId && pCats.has(reqMajorId)) {
          categoryScore = 8 // 대분류 일치
        } else {
          // 파트너 카테고리의 parent를 확인 (중분류 → 대분류)
          for (const pcId of pCats) {
            const pc = categoryMap.get(pcId)
            if (pc?.parent_id === reqMajorId) {
              categoryScore = Math.max(categoryScore, 5)
            }
          }
        }
      }

      // 레거시: field TEXT 기반 매칭 (partner_category가 없을 때)
      if (categoryScore === 0 && partner.field && request.req_type) {
        const field = partner.field.toLowerCase()
        const reqType = request.req_type.toLowerCase()
        for (const f of field.split(',')) {
          const ft = f.trim()
          if (ft === reqType) {
            categoryScore = 15
            break
          } else if (ft.includes(reqType) || reqType.includes(ft)) {
            categoryScore = Math.max(categoryScore, 8)
          }
        }
      }

      // 2. 키워드 매칭
      const text = `${request.title} ${request.detail}`.toLowerCase()
      const keywords = text.split(/[\s,./·()]+/).filter((k) => k.length >= 2)
      const field = (partner.field || '').toLowerCase()
      for (const kw of keywords) {
        if (field.includes(kw)) keywordScore += 3
      }

      // 3. 경력 보너스
      if (partner.career_yrs && partner.career_yrs > 0) {
        careerScore = Math.min(partner.career_yrs, 10)
      }

      // 4. 관심 표현 보너스
      if (interestSet.has(partner.id)) {
        interestScore = 10
      }

      // 5. 과거 평점 보너스
      const stats = statsMap.get(partner.id)
      if (stats && stats.avg_rating > 0) {
        ratingScore = Math.round(stats.avg_rating)
      }

      // 6. 완료 거래 실적
      if (stats && stats.deal_count > 0) {
        trackScore = Math.min(stats.deal_count * 2, 10)
      }

      const score =
        categoryScore + keywordScore + careerScore + interestScore + ratingScore + trackScore

      return {
        partner,
        score,
        scoreDetail: {
          category: categoryScore,
          keyword: keywordScore,
          career: careerScore,
          interest: interestScore,
          rating: ratingScore,
          track: trackScore,
        },
      }
    })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
}
