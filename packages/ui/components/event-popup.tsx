'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
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

// 닫힘 상태는 쿠키에 저장한다 — localStorage는 (1) 서브도메인(owner/expert/admin)마다 분리돼
// 한 앱에서 닫아도 다른 앱에서 다시 뜨고, (2) 사파리 사생활 모드 등에서 setItem이 예외를 던져
// 조용히 저장 실패한다. .jisane.cloud 도메인 쿠키면 3앱 공유 + 사생활 모드서도 견고.
function getCookie(name: string): string | null {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : null
  } catch {
    return null
  }
}
function setDismissCookie(value: string): void {
  try {
    // 프로드(*.jisane.cloud)는 서브도메인 공유, 로컬/기타는 host-only.
    const host = window.location.hostname
    const domain = host.endsWith('jisane.cloud') ? '; domain=.jisane.cloud' : ''
    const secure = window.location.protocol === 'https:' ? '; Secure' : ''
    // max-age 1일(정리용); 실제 "오늘" 판정은 저장된 날짜 문자열 === 오늘 비교로 한다.
    document.cookie = `${DISMISS_KEY}=${value}; path=/; max-age=86400; SameSite=Lax${secure}${domain}`
  } catch {
    /* 무시 */
  }
}

// 닫힘 상태 이중 저장(회복력): 쿠키(3앱 공유)를 우선으로 하되, 쿠키가 차단된 브라우저를 위해
// localStorage도 함께 쓴다. 읽을 때는 둘 중 하나라도 "오늘"이면 닫힌 것으로 본다.
function readDismissed(): string | null {
  const c = getCookie(DISMISS_KEY)
  if (c) return c
  try {
    return localStorage.getItem(DISMISS_KEY)
  } catch {
    return null
  }
}
function persistDismiss(value: string): void {
  setDismissCookie(value)
  try {
    localStorage.setItem(DISMISS_KEY, value)
  } catch {
    /* 무시 */
  }
}

/**
 * 시니어지식인 100인 초빙 이벤트 팝업 — 3앱 공유(중앙 모달, 하루 1회, 마감 자동 종료).
 * SSR 안전: 서버에선 null, 클라이언트 useEffect에서 노출 결정(하이드레이션 미스매치 방지).
 * a11y: role=dialog·aria-modal·포커스 트랩(resolveTrapKey)·Escape/오버레이 닫기. 모션은 reduced-motion 가드(globals).
 */
export function EventPopup({
  eventUrl,
  hideOnPrefixes,
}: {
  eventUrl: string
  /** 이 경로들(prefix)에선 팝업을 띄우지 않음 — 관리자/인증/관리 화면·이벤트 페이지 제외용 */
  hideOnPrefixes?: string[]
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const dismissRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const today = todayStr()
    if (today > EVENT_END) return // 마감 후 미노출
    if (readDismissed() === today) return // 오늘 이미 닫음(쿠키 공유 + localStorage 백업)

    // 허브 스플래시 오버레이와 겹치지 않도록: 스플래시가 떠 있으면 닫힌 뒤 노출.
    // (owner/expert엔 스플래시가 없어 플래그가 없으므로 즉시 노출)
    // setTimeout(0): 스플래시 마운트 이펙트가 플래그를 세팅할 시간 확보(이펙트 순서 방어).
    let cleanup: (() => void) | undefined
    const t = setTimeout(() => {
      const w = window as Window & { __jisaneSplashActive?: boolean }
      if (w.__jisaneSplashActive) {
        const onClosed = () => setOpen(true)
        window.addEventListener('jisane:splash-closed', onClosed, { once: true })
        cleanup = () => window.removeEventListener('jisane:splash-closed', onClosed)
      } else {
        setOpen(true)
      }
    }, 0)
    return () => {
      clearTimeout(t)
      cleanup?.()
    }
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
    persistDismiss(todayStr())
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

  const hidden = !!hideOnPrefixes?.some((p) => pathname?.startsWith(p))
  if (!open || hidden) return null

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
          <X className="h-4 w-4" aria-hidden="true" />
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
          onClick={close}
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
