'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

interface TextRotatorProps {
  words: string[]
  interval?: number
  className?: string
  /** 일시정지 버튼 색상 클래스(다크 히어로 등 배경별 대비 조정). 미지정 시 밝은 배경용 기본값. */
  buttonClassName?: string
}

// prefers-reduced-motion 구독 (useSyncExternalStore 외부 시스템 패턴)
function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

/**
 * 자동 회전 헤드라인 워드 로테이터.
 * WCAG 2.2.2(Pause, Stop, Hide): 5초 넘게 자동 갱신되는 콘텐츠라 일시정지 버튼을 내장한다.
 * prefers-reduced-motion: reduce면 회전 자체를 시작하지 않는다(버튼도 숨김).
 * 회전 텍스트는 aria-hidden(장식) — AT에는 전체 문구를 정적으로 1회만 제공해
 * 무한 낭독 인터럽트(구 aria-live)를 제거한다.
 */
export function TextRotator({ words, interval = 2500, className = '', buttonClassName }: TextRotatorProps) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const [paused, setPaused] = useState(false)
  // 모션 허용 여부 — SSR에서는 false(버튼 미노출), 하이드레이션 후 실제 값으로 갱신
  const motionOK = useSyncExternalStore(
    subscribeReducedMotion,
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  )

  const next = useCallback(() => {
    setPhase('out')
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % words.length)
      setPhase('in')
    }, 300)
  }, [words.length])

  useEffect(() => {
    if (!motionOK || paused) return

    const id = setInterval(next, interval)
    return () => clearInterval(id)
  }, [next, interval, motionOK, paused])

  return (
    <>
      <span className="inline-flex overflow-hidden align-bottom" aria-hidden="true">
        <span
          className={`inline-block transition-all duration-300 ease-out ${className}`}
          suppressHydrationWarning
          style={{
            transform: phase === 'in' ? 'translateY(0)' : 'translateY(-100%)',
            opacity: phase === 'in' ? 1 : 0,
          }}
        >
          {words[index]}
        </span>
      </span>
      <span className="sr-only">{words.join(', ')}</span>
      {motionOK && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? '문구 회전 재생' : '문구 회전 일시정지'}
          className={`focus-ring ml-1.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded align-middle text-sm transition-colors ${buttonClassName || 'text-text-subtle hover:text-text-muted'}`}
        >
          {paused ? '▶︎' : '⏸︎'}
        </button>
      )}
    </>
  )
}
