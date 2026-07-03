'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

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
        <Image
          src="/jisaneadmin-hero-image.png"
          alt="지사네"
          width={280}
          height={100}
          priority
          className="h-auto w-[280px]"
        />
        <h2 className="text-3xl font-bold text-primary">지사네</h2>
        <p className="text-base text-text-muted leading-relaxed">
          부울경 검증된 시니어 전문가를
          <br />
          지역 기업과 직접 연결합니다
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
