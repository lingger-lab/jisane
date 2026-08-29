import type { EnterprisePillar } from '@jisane/shared/service-catalog'

/**
 * 동기화 스킬을 5대 지원 pillar로 자동 분류 — 순수·결정적(단위테스트 대상).
 * category_slug 맵(+2) + 제목(×2)·설명(×1) 키워드 스코어링. 동점은 특이도순으로 깬다.
 * 전부 0점이면 ai_ax(소스가 AI 스킬 대시보드라 보수적 기본값).
 */

const CATEGORY_PILLAR: Record<string, EnterprisePillar> = {
  'ai-automation': 'ai_ax',
  'data-analysis': 'ai_ax',
  'dev-tools': 'ai_ax',
  'content-marketing': 'online_sales',
  'election-politics': 'online_sales',
  'gov-rnd': 'biz_marketing',
  'strategy-planning': 'biz_marketing',
  'startup-item': 'biz_marketing',
  'lecture-general': 'biz_marketing',
}

// ASCII 단토큰(AI·AX·GPT 등)은 단어경계(\b)로 오매칭(brain, email 등) 방지. 한글은 부분일치.
const KEYWORDS: Record<EnterprisePillar, RegExp> = {
  finance_tax: /세무|재무|회계|자금|절세|세금|장부|결산|정산/,
  tech_quality: /품질|생산|공정|제조|검사|불량|설비|기술개발/,
  online_sales: /마케팅|홍보|콘텐츠|판로|블로그|광고|여론|평판|쇼핑몰|커머스|온라인|\bSNS\b/i,
  ai_ax: /인공지능|자동화|데이터|챗봇|디지털\s?전환|\bAI\b|\bAX\b|\bGPT\b|\bRAG\b|\bLLM\b/i,
  biz_marketing: /사업계획|창업|사업화|전략|기획|인증|정부지원|보조금|지원사업|R&D/,
}

// 동점 우선순위 — 특이도 높은 순(모호한 ai_ax를 맨 뒤로)
const TIE_ORDER: EnterprisePillar[] = ['finance_tax', 'tech_quality', 'online_sales', 'biz_marketing', 'ai_ax']

export function classifyPillar(
  title: string,
  description: string | null | undefined,
  categorySlug: string | null | undefined,
): EnterprisePillar {
  const scores: Record<EnterprisePillar, number> = {
    biz_marketing: 0,
    finance_tax: 0,
    tech_quality: 0,
    online_sales: 0,
    ai_ax: 0,
  }

  if (categorySlug && CATEGORY_PILLAR[categorySlug]) scores[CATEGORY_PILLAR[categorySlug]] += 2

  const t = title || ''
  const d = description || ''
  for (const p of TIE_ORDER) {
    if (KEYWORDS[p].test(t)) scores[p] += 2
    if (KEYWORDS[p].test(d)) scores[p] += 1
  }

  let best: EnterprisePillar = 'ai_ax'
  let bestScore = -1
  for (const p of TIE_ORDER) {
    if (scores[p] > bestScore) {
      bestScore = scores[p]
      best = p
    }
  }
  return bestScore <= 0 ? 'ai_ax' : best
}
