'use client'

import { useState } from 'react'
import { OwlIcon } from '@jisane/ui/icons/owl'

export function SplashOverlay() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  if (!visible) return null

  function handleEnter() {
    setFading(true)
    setTimeout(() => setVisible(false), 400)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#f3efe6' }}
      className={`flex flex-col items-center justify-center transition-opacity duration-400 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center animate-fade-in">
        <OwlIcon className="h-[120px] w-[120px] text-primary" />
        <h2 className="text-3xl font-bold text-brand-gradient">지사네</h2>
        <p className="text-lg font-semibold text-text mt-1">일은 사람이 합니다</p>
        <p className="text-base text-text-muted leading-relaxed mt-2">
          부울경 시니어 전문가 직거래 플랫폼
        </p>
        <button
          type="button"
          onClick={handleEnter}
          className="mt-4 rounded-xl bg-primary px-8 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md btn-press"
        >
          시작하기 &rarr;
        </button>
      </div>
    </div>
  )
}
