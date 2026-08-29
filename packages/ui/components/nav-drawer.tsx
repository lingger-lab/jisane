'use client'

import { useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Menu, X } from 'lucide-react'
import { resolveTrapKey } from './focus-trap'
import { cn } from '../lib/cn'

/**
 * 모바일 내비 드로어 — 헤더 우측 유틸/인증 항목을 햄버거로 접어 혼잡을 없앤다(md 미만 전용).
 * confirm-dialog 오버레이 패턴 + focus-trap(resolveTrapKey)을 재사용해 키보드 트랩·Esc·오버레이 닫기를 보장.
 * 라우터 훅에 의존하지 않고, 패널 내부의 링크/제출 버튼 클릭 시 자동으로 닫는다(포크 안전).
 */
export function NavDrawer({
  label = '메뉴',
  side = 'right',
  children,
}: {
  label?: string
  side?: 'left' | 'right'
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // 오버레이를 body로 포탈 — 헤더의 backdrop-filter/transform이 fixed를 헤더 박스에 가두는 것을 회피.
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus()
    }, 0)
    document.body.style.overflow = 'hidden' // 배경 스크롤 잠금
    return () => {
      clearTimeout(t)
      document.body.style.overflow = ''
    }
  }, [open])

  function focusables(): HTMLElement[] {
    if (!panelRef.current) return []
    return Array.from(
      panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    )
  }

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  function onKeyDown(e: KeyboardEvent) {
    const els = focusables()
    const active = els.indexOf(document.activeElement as HTMLElement)
    const r = resolveTrapKey(e.key, e.shiftKey, active, els.length)
    if (r.type === 'close') {
      e.preventDefault()
      close()
    } else if (r.type === 'focus') {
      e.preventDefault()
      els[r.index]?.focus()
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/40 animate-fade-in md:hidden"
          onClick={close}
          onKeyDown={onKeyDown}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={cn(
              'absolute top-0 h-full w-72 max-w-[80vw] overflow-y-auto bg-background p-5 shadow-float',
              side === 'right' ? 'right-0 border-l border-border-light animate-drawer-in-right' : 'left-0 border-r border-border-light animate-drawer-in-left',
            )}
            onClick={(e) => {
              e.stopPropagation()
              // 내부 링크·제출 버튼 클릭 시 자동 닫힘(네비/로그인/로그아웃)
              if ((e.target as HTMLElement).closest('a[href], button[type="submit"]')) close()
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-text">{label}</span>
              <button
                type="button"
                onClick={close}
                aria-label="닫기"
                className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {children}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
