'use client'

import { useEffect } from 'react'

/**
 * 상단 고정 헤더 자동 숨김/재등장 — 아래로 스크롤 시 숨기고(콘텐츠 공간 확보), 위로 스크롤 시 재등장.
 * 방향 감지가 필요해 순수 CSS(scroll())로는 불가 → 최소 JS로 <html>에 .header-hidden만 토글하고,
 * 실제 이동은 CSS transform 트랜지션(컴포지터)이 담당. passive 리스너 + rAF 스로틀로 가볍게.
 * prefers-reduced-motion에서는 숨기지 않는다(항상 표시). 렌더 없음.
 */
export function HeaderAutoHide() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const root = document.documentElement
    const THRESHOLD = 80 // 최상단 근처(이 아래)에서는 항상 표시
    const DELTA = 6 // 미세 흔들림 무시
    let lastY = window.scrollY
    let ticking = false

    function update() {
      ticking = false
      const y = window.scrollY
      if (Math.abs(y - lastY) < DELTA) return
      if (y > lastY && y > THRESHOLD) {
        root.classList.add('header-hidden') // 아래로 → 숨김
      } else if (y < lastY) {
        root.classList.remove('header-hidden') // 위로 → 재등장
      }
      lastY = y
    }
    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      root.classList.remove('header-hidden')
    }
  }, [])

  return null
}
