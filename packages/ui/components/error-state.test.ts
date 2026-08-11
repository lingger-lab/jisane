import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ErrorState } from './error-state'

// 감사 docs/10 T2·docs/11 P2-43 등: 쿼리 실패가 빈 상태로 위장되던 페이지들이
// 공통으로 쓰는 에러 상태 카드 — role="alert"(D2 패턴)와 문구 표면화를 고정한다.
describe('ErrorState', () => {
  it('role="alert"와 기본 메시지·새로고침 유도 문구를 렌더한다', () => {
    const html = renderToStaticMarkup(createElement(ErrorState))
    expect(html).toContain('role="alert"')
    expect(html).toContain('목록을 불러오지 못했습니다.')
    expect(html).toContain('잠시 후 새로고침해 다시 시도해주세요.')
  })

  it('섹션별 커스텀 메시지를 렌더한다', () => {
    const html = renderToStaticMarkup(
      createElement(ErrorState, { message: '의뢰 목록을 불러오지 못했습니다.' })
    )
    expect(html).toContain('의뢰 목록을 불러오지 못했습니다.')
  })
})
