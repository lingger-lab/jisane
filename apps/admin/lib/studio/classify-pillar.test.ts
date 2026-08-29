import { describe, it, expect } from 'vitest'
import { classifyPillar } from './classify-pillar'

describe('classifyPillar', () => {
  it('키워드 — 각 pillar 대표', () => {
    expect(classifyPillar('생산 품질 공정 진단', '', null)).toBe('tech_quality')
    expect(classifyPillar('세무·재무 자문', '', null)).toBe('finance_tax')
    expect(classifyPillar('온라인 판로개척 마케팅', '', null)).toBe('online_sales')
    expect(classifyPillar('AI 챗봇 플랫폼', '', null)).toBe('ai_ax')
    expect(classifyPillar('벤처기업인증 사업계획서', '', null)).toBe('biz_marketing')
  })

  it('category_slug 폴백(+2)', () => {
    expect(classifyPillar('CampOne', '', 'content-marketing')).toBe('online_sales')
    expect(classifyPillar('R&D Cost Planner', '', 'gov-rnd')).toBe('biz_marketing')
    expect(classifyPillar('VibeKit', '', 'dev-tools')).toBe('ai_ax')
  })

  it('제목(×2)이 설명(×1)보다 우선', () => {
    // 제목=finance(2), 설명=online(1) → finance
    expect(classifyPillar('세무 리포트', '마케팅에도 활용', null)).toBe('finance_tax')
  })

  it('동점은 특이도순(finance>tech>online>biz>ai)', () => {
    // 세무(finance+2) vs 자동화(ai_ax+2) → finance
    expect(classifyPillar('세무 자동화 도구', '', null)).toBe('finance_tax')
  })

  it('전부 0점이면 ai_ax 폴백', () => {
    expect(classifyPillar('무제 서비스', '설명 없음', null)).toBe('ai_ax')
    expect(classifyPillar('', '', null)).toBe('ai_ax')
  })

  it('단어경계 — brain은 AI로 오분류 안 함', () => {
    // 'brain'에 ai가 있지만 \bAI\b 미매칭, 키워드 0 → ai_ax 폴백(오분류 아님, 기본값)
    expect(classifyPillar('재무 회계 brainstorm', '', null)).toBe('finance_tax')
  })

  it('category와 키워드 합산', () => {
    // category ai-automation(+2) + 제목 데이터(ai_ax +2) = ai_ax 4
    expect(classifyPillar('데이터 분석 자동화', '', 'ai-automation')).toBe('ai_ax')
  })
})
