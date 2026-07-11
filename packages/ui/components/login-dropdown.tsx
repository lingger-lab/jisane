'use client'

import { useState, useRef, useEffect } from 'react'
import { KakaoIcon } from './icons/kakao'
import { GoogleIcon } from './icons/google'

export function LoginDropdown({
  signInWithKakao,
  signInWithGoogle,
}: {
  signInWithKakao: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="로그인 메뉴"
        aria-expanded={open}
        className="text-sm text-text-muted hover:text-text transition-colors"
      >
        로그인 ▾
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border-light bg-white p-2 shadow-lg animate-fade-in">
          <form action={signInWithKakao}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[#191919] hover:bg-[#FEE500]/20 transition-colors"
            >
              <KakaoIcon className="h-4 w-4" />
              카카오로 로그인
            </button>
          </form>
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text hover:bg-gray-100 transition-colors"
            >
              <GoogleIcon className="h-4 w-4" />
              Google로 로그인
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
