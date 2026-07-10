'use client'

import { useState, useEffect } from 'react'
import { OwlIcon } from '@jisane/ui/icons/owl'

const STORAGE_KEY = 'jisane_splash_seen'

export function SplashOverlay() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setVisible(false)
      }
    } catch {
      // sessionStorage 사용 불가 시 스플래시 표시
    }
  }, [])

  if (!visible) return null

  function handleEnter() {
    setFading(true)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    setTimeout(() => setVisible(false), 400)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-400 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center animate-fade-in">
        <OwlIcon className="h-[120px] w-[120px] text-primary" />
        <h2 className="text-3xl font-bold text-brand-gradient">지사네</h2>
        <p className="text-lg font-semibold text-text mt-1">만든 사람이 갖는다</p>
        <p className="text-base text-text-muted leading-relaxed mt-2">
          값도, 범위도, 먼저 공개합니다
          <br />
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
