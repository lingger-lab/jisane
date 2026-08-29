import { describe, it, expect } from 'vitest'
import { generateBannerPrompt, getComboLabel, TOTAL_COMBINATIONS, PALETTE_LABELS } from './banner-prompt'

const input = { title: 'AI 진단', subtitle: '무료 진단 리포트', features: ['리포트', '로드맵'], category: 'ax_consulting' }

describe('generateBannerPrompt', () => {
  it('결정적 — 같은 seed·palette는 같은 결과', () => {
    expect(generateBannerPrompt(input, 5, 'jisane')).toBe(generateBannerPrompt(input, 5, 'jisane'))
  })

  it('제목·부제 치환 + 16:9 헤더 포함', () => {
    const p = generateBannerPrompt(input, 0, 'jisane')
    expect(p).toContain('AI 진단')
    expect(p).toContain('무료 진단 리포트')
    expect(p).toContain('16:9')
  })

  it('팔레트가 프롬프트에 반영', () => {
    expect(generateBannerPrompt(input, 0, 'jisane')).toContain('1f5c46')
    expect(generateBannerPrompt(input, 0, 'youtube')).toContain('FF0000')
  })

  it('seed로 스타일 조합이 달라짐', () => {
    expect(getComboLabel(0)).not.toBe(getComboLabel(1))
  })

  it('음수 seed도 안전(mod)', () => {
    expect(() => generateBannerPrompt(input, -3, 'jisane')).not.toThrow()
    expect(generateBannerPrompt(input, -3, 'jisane')).toContain('16:9')
  })

  it('조합 수·팔레트 라벨', () => {
    expect(TOTAL_COMBINATIONS).toBe(6 * 6 * 5)
    expect(Object.keys(PALETTE_LABELS)).toContain('jisane')
  })
})
