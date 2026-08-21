'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface RoleSwitchItem {
  label: string
  url: string
}

/**
 * 헤더 "회원 전환" 드롭다운 — 기업회원 ↔ 시니어지식인 등 다른 역할 사이트로 이동.
 * 로그인 상태면 "로그아웃 후 전환" 안내를 함께 노출(공유세션이라 깔끔한 전환은 재로그인 권장).
 */
export function RoleSwitchMenu({ items, loggedIn }: { items: RoleSwitchItem[]; loggedIn?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (items.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="focus-ring inline-flex min-h-6 items-center gap-0.5 rounded text-xs text-text-subtle transition-colors hover:text-text"
      >
        회원 전환
        <ChevronDown aria-hidden="true" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="회원 전환"
          className="absolute left-0 top-full z-50 mt-1.5 min-w-52 rounded-lg border border-border-light bg-background p-1 shadow-md md:left-auto md:right-0"
        >
          {items.map((it) => (
            <a
              key={it.url}
              href={it.url}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text"
            >
              {it.label}
            </a>
          ))}
          {loggedIn && (
            <p className="mt-0.5 border-t border-border-light px-3 py-2 text-[11px] leading-snug text-text-subtle">
              다른 회원으로 전환하려면 <span className="font-medium text-text-muted">로그아웃 후</span> 해당 화면에서 로그인하세요.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
