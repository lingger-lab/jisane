'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * 스크롤 진입 시 fade-up 등장 — 뷰포트에 15% 들어오면 1회 .revealed 부여.
 * reduced-motion 환경은 CSS에서 즉시 표시 처리 (globals.css .reveal 참조).
 */
export function ScrollReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  /** 등장 시차 단계 (0~3 — .reveal-delay-N) */
  delay?: 0 | 1 | 2 | 3
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal${revealed ? ' revealed' : ''}${delay ? ` reveal-delay-${delay}` : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  )
}
