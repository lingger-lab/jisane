'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from 'react'
import { resolveTrapKey } from './focus-trap'
import { cn } from '../lib/cn'

export interface ConfirmOptions {
  title: string
  message?: ReactNode
  confirmText?: string
  cancelText?: string
  /** 파괴적 액션 — 확인 버튼 danger 스타일 */
  danger?: boolean
}

/**
 * 접근성 확인 다이얼로그 훅 — window.confirm 대체(커스텀 모달).
 * 반환: [confirm(opts): Promise<boolean>, dialog: ReactNode].
 * `if (await confirm({...})) { ... }` 형태로 동기 confirm을 비동기로 교체.
 * role=alertdialog·aria-modal·포커스 트랩(resolveTrapKey)·Escape/오버레이=취소.
 * 파괴적 액션은 열릴 때 '취소'에 포커스(안전 기본값). 모션은 reduced-motion 가드.
 */
export function useConfirmDialog() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  const confirm = useCallback(
    (o: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve
        setOpts(o)
      }),
    [],
  )

  const settle = useCallback((v: boolean) => {
    resolver.current?.(v)
    resolver.current = null
    setOpts(null)
  }, [])

  useEffect(() => {
    if (!opts) return
    const t = setTimeout(() => cancelRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [opts])

  function onKeyDown(e: KeyboardEvent) {
    const els = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[]
    const active = els.indexOf(document.activeElement as HTMLElement)
    const r = resolveTrapKey(e.key, e.shiftKey, active, els.length)
    if (r.type === 'close') {
      e.preventDefault()
      settle(false)
    } else if (r.type === 'focus') {
      e.preventDefault()
      els[r.index]?.focus()
    }
  }

  const dialog = opts ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={() => settle(false)}
      onKeyDown={onKeyDown}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={opts.title}
        className="w-full max-w-sm rounded-2xl border border-border-light bg-card p-6 shadow-float animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-serif font-bold text-text">{opts.title}</h2>
        {opts.message && <p className="mt-2 text-sm leading-relaxed text-text-muted">{opts.message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => settle(false)}
            className="btn-press focus-ring rounded-xl border border-border bg-surface-warm px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface"
          >
            {opts.cancelText || '취소'}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => settle(true)}
            className={cn(
              'btn-press focus-ring rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors',
              opts.danger ? 'bg-error-solid hover:brightness-95' : 'bg-primary hover:bg-primary-600',
            )}
          >
            {opts.confirmText || '확인'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return [confirm, dialog] as const
}
