'use client'

import { useState, useEffect, useCallback } from 'react'

interface TextRotatorProps {
  words: string[]
  interval?: number
  className?: string
}

export function TextRotator({ words, interval = 2500, className = '' }: TextRotatorProps) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'in' | 'out'>('in')

  const next = useCallback(() => {
    setPhase('out')
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % words.length)
      setPhase('in')
    }, 300)
  }, [words.length])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const id = setInterval(next, interval)
    return () => clearInterval(id)
  }, [next, interval])

  return (
    <span
      className="inline-flex overflow-hidden align-bottom"
      aria-live="polite"
      aria-atomic="true"
    >
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
  )
}
