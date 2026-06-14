import type { PartnerRow } from '@/lib/types'

export interface ScoredPartner {
  partner: PartnerRow
  score: number
}

interface RequestInput {
  title: string
  detail: string
  req_type: string | null
}

/**
 * 키워드 기반 파트너 후보 추천 (마스터문서 v3.3 §4)
 *
 * 점수 기준:
 * - req_type ↔ partner.field 정확 일치: +10
 * - req_type ↔ partner.field 부분 포함: +5
 * - title/detail 키워드가 partner.field에 포함: 키워드당 +2
 * - career_yrs 보너스: min(경력, 10)
 *
 * 상위 maxResults명 반환 (기본 5)
 */
export function findCandidates(
  request: RequestInput,
  partners: PartnerRow[],
  maxResults = 5
): ScoredPartner[] {
  const scored: ScoredPartner[] = partners
    .filter((p) => p.status === 'active' && p.field)
    .map((partner) => {
      let score = 0
      const field = (partner.field || '').toLowerCase()

      // 1. req_type ↔ field 매칭
      if (request.req_type) {
        const reqType = request.req_type.toLowerCase()
        if (field === reqType) {
          score += 10
        } else if (field.includes(reqType) || reqType.includes(field)) {
          score += 5
        }
      }

      // 2. title/detail 키워드 → field 포함 여부
      const text = `${request.title} ${request.detail}`.toLowerCase()
      const keywords = text
        .split(/[\s,./·()]+/)
        .filter((k) => k.length >= 2)
      for (const kw of keywords) {
        if (field.includes(kw)) {
          score += 2
        }
      }

      // 3. career_yrs 보너스
      if (partner.career_yrs && partner.career_yrs > 0) {
        score += Math.min(partner.career_yrs, 10)
      }

      return { partner, score }
    })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
}
