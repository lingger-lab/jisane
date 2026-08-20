'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { resolveTrapKey } from './focus-trap'

/** 이벤트 마감(이 날짜 이후 자동 미노출) */
const EVENT_END = '2026-09-30'
const DISMISS_KEY = 'event_senior100_dismissed'

function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * 시니어지식인 100인 초빙 이벤트 팝업 — 3앱 공유(중앙 모달, 하루 1회, 마감 자동 종료).
 * SSR 안전: 서버에선 null, 클라이언트 useEffect에서 노출 결정(하이드레이션 미스매치 방지).
 * a11y: role=dialog·aria-modal·포커스 트랩(resolveTrapKey)·Escape/오버레이 닫기. 모션은 reduced-motion 가드(globals).
 */
export function EventPopup({ eventUrl }: { eventUrl: string }) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const dismissRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const today = todayStr()
    if (today > EVENT_END) return // 마감 후 미노출
    let dismissed: string | null = null
    try {
      dismissed = localStorage.getItem(DISMISS_KEY)
    } catch {
      /* localStorage 불가 환경 — 그냥 노출 */
    }
    if (dismissed === today) return // 오늘 이미 닫음
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => closeRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  function close() {
    setOpen(false)
  }
  function dismissToday() {
    try {
      localStorage.setItem(DISMISS_KEY, todayStr())
    } catch {
      /* 무시 */
    }
    setOpen(false)
  }

  function onKeyDown(e: KeyboardEvent) {
    const els = [closeRef.current, ctaRef.current, dismissRef.current].filter(Boolean) as HTMLElement[]
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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={close}
      onKeyDown={onKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="시니어 지식인 100인 초빙 이벤트"
        className="relative w-full max-w-sm rounded-2xl border border-border-light bg-card p-6 shadow-float animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="닫기"
          className="focus-ring absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-text-subtle transition-colors hover:bg-surface hover:text-text"
        >
          ✕
        </button>

        <p className="text-xs font-semibold tracking-wide text-accent">시니어지식인 회원 이벤트</p>
        <h2 className="mt-1 text-lg font-serif font-bold leading-snug text-text">시니어 지식인 100인 초빙</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          경험과 지식이 다시 기회가 되는 곳. 주변 전문가를 초빙하고 <span className="font-semibold text-text">현금 리워드</span>를 받으세요.
        </p>

        <dl className="mt-4 flex flex-col gap-1 rounded-xl bg-surface-warm p-3 text-xs text-text-muted">
          <div className="flex justify-between"><dt>기간</dt><dd className="font-medium text-text">~ 9월 30일</dd></div>
          <div className="flex justify-between"><dt>리워드</dt><dd className="font-medium text-text">1명 2만원 → 최대 5명 20만원</dd></div>
          <div className="flex justify-between"><dt>지급</dt><dd className="font-medium text-text">종료 후 10일 내 현금</dd></div>
        </dl>

        <a
          ref={ctaRef}
          href={eventUrl}
          className="btn-press focus-ring mt-5 flex w-full items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          초빙 이벤트 자세히 보기 &rarr;
        </a>

        <div className="mt-3 text-center">
          <button
            ref={dismissRef}
            type="button"
            onClick={dismissToday}
            className="focus-ring rounded text-xs text-text-subtle transition-colors hover:text-text-muted"
          >
            오늘 그만보기
          </button>
        </div>
      </div>
    </div>
  )
}
