import { FAQ_DATA, type FaqItem } from './faq-data'

const MATCH_THRESHOLD = 0.3

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[??.!,·()（）「」""'']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((t) => t.length >= 2)
}

/**
 * FAQ 키워드 매칭
 * 질문 토큰과 FAQ 키워드 겹침 비율로 점수 산정
 */
export function matchFaq(question: string): { faq: FaqItem | null; score: number } {
  const tokens = tokenize(question)
  if (tokens.length === 0) {
    return { faq: null, score: 0 }
  }

  let bestFaq: FaqItem | null = null
  let bestScore = 0

  for (const faq of FAQ_DATA) {
    const faqKeywords = faq.keywords.map((k) => k.toLowerCase())

    // 겹침 수 계산
    let matchCount = 0
    for (const token of tokens) {
      for (const keyword of faqKeywords) {
        if (keyword.includes(token) || token.includes(keyword)) {
          matchCount++
          break
        }
      }
    }

    // 점수 = 겹침 수 / 질문 토큰 수
    const score = matchCount / tokens.length

    if (score > bestScore) {
      bestScore = score
      bestFaq = faq
    }
  }

  if (bestScore >= MATCH_THRESHOLD && bestFaq) {
    return { faq: bestFaq, score: bestScore }
  }

  return { faq: null, score: bestScore }
}
