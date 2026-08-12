import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CharLimitNotice } from './char-limit-notice'

// 감사 docs/10 T22: maxLength 상한 도달 시 입력이 조용히 무시되는 no-op.
// 90% 미만=무렌더(평상시 소음 없음) · 근접=카운터 · 도달=상한 안내를 고정한다.
describe('CharLimitNotice', () => {
  it('상한의 90% 미만이면 아무것도 렌더하지 않는다', () => {
    expect(renderToStaticMarkup(createElement(CharLimitNotice, { length: 0, max: 1000 }))).toBe('')
    expect(renderToStaticMarkup(createElement(CharLimitNotice, { length: 899, max: 1000 }))).toBe('')
  })

  it('상한에 근접하면 카운터를 렌더한다', () => {
    const html = renderToStaticMarkup(createElement(CharLimitNotice, { length: 900, max: 1000 }))
    expect(html).toContain('900/1,000자')
    expect(html).toContain('role="status"')
  })

  it('상한 도달 시 상한 안내를 렌더한다', () => {
    const html = renderToStaticMarkup(createElement(CharLimitNotice, { length: 1000, max: 1000 }))
    expect(html).toContain('최대 1,000자까지 입력할 수 있습니다')
    expect(html).toContain('role="status"')
  })
})
