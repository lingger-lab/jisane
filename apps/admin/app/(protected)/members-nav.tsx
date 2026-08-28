'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

const ITEMS = [
  { href: '/members/owner', label: '기업회원' },
  { href: '/members/expert', label: '시니어지식인' },
  { href: '/members/partner', label: '전문가회원' },
]

/**
 * 헤더 "회원" 드롭다운 — 회원 3유형 페이지로 이동 (하단 프로세스 탭에서 분리).
 * 상위 nav가 overflow-x-auto(가로 스크롤·2줄 방지)라 absolute 메뉴는 세로로 잘린다 →
 * position:fixed로 오버플로 컨테이너를 탈출시켜 트리거 바로 아래에 띄운다.
 */
export function MembersNav() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

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

  function toggle() {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left })
    }
    setOpen((v) => !v)
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="focus-ring inline-flex items-center gap-1 rounded text-sm text-text-muted transition-colors hover:text-text"
      >
        회원
        <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && pos && (
        <div
          role="menu"
          aria-label="회원 관리"
          style={{ position: 'fixed', top: pos.top, left: pos.left }}
          className="z-50 min-w-40 max-w-[calc(100vw-2rem)] rounded-lg border border-border-light bg-background p-1 shadow-md"
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
