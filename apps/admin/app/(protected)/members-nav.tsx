'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

const ITEMS = [
  { href: '/members/owner', label: '기업회원' },
  { href: '/members/expert', label: '시니어지식인' },
  { href: '/members/partner', label: '전문가회원' },
]

/** 헤더 "회원" 드롭다운 — 회원 3유형 페이지로 이동 (하단 프로세스 탭에서 분리) */
export function MembersNav() {
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="focus-ring inline-flex items-center gap-1 rounded text-sm text-text-muted transition-colors hover:text-text"
      >
        회원
        <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="회원 관리"
          className="absolute left-0 top-full z-50 mt-1.5 min-w-40 rounded-lg border border-border-light bg-background p-1 shadow-md"
        >
          {ITEMS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text"
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
