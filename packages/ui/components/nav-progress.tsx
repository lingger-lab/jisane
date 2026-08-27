'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'

/**
 * 네비게이션 진행 표시 — 모든 내부 이동에 상단 브랜드 그린 바를 **자동·기본**으로 띄운다.
 * 클릭→전환 커밋 사이(콜드캐시·프리페치 미완)에 옛 화면이 얼어붙어 피드백이 없던 지루함 제거.
 *
 * 동작(문구 없는 비주얼 전용):
 * - 시작: document capture 클릭 리스너가 모든 내부 <a> 좌클릭을 자동 감지(링크 래핑 불필요).
 * - 완료: usePathname 변경 시 100%→페이드. useSearchParams는 쓰지 않아 SSR 정적렌더 deopt 회피.
 * - 즉시 전환도 최소 가시시간(MIN_VISIBLE_MS)만큼 짧게 스윕 → "전환됨"이 항상 일관 피드백.
 * - prefers-reduced-motion: 애니메이션 없이 짧게 표시 후 소멸(globals.css .nav-progress--*).
 *
 * pendingHref는 클릭한 요소의 로컬 모션(탭·카드)에서 자기 href와 비교하는 데 쓴다.
 */

type Phase = 'idle' | 'active' | 'done'

interface NavProgressValue {
  /** 프로그램 이동(폼 제출 후 router.push 등)에서 수동 시작. 클릭 이동은 자동 감지된다. */
  start: (href?: string) => void
  /** 현재 전환 중인 대상 경로(클릭 요소 로컬 모션용). 없으면 null. */
  pendingHref: string | null
}

const NavProgressContext = createContext<NavProgressValue | null>(null)

export function useNavProgress(): NavProgressValue {
  const ctx = useContext(NavProgressContext)
  if (!ctx) throw new Error('useNavProgress must be used within NavProgressProvider')
  return ctx
}

const MIN_VISIBLE_MS = 350 // 즉시 전환도 최소 이만큼 바를 보여준다(일관 피드백)
const MAX_DURATION_MS = 8000 // 경로 변경이 오지 않아도(취소/실패) 이 시간 후 강제 완료

export function NavProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [phase, setPhase] = useState<Phase>('idle')
  const [runId, setRunId] = useState(0) // 매 이동마다 바 애니메이션 재시작(key)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const activeRef = useRef(false)
  const startAtRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const prevPathRef = useRef(pathname)
  const markedRef = useRef<Element | null>(null) // 클릭된 <a> — 로컬 pending 펄스 대상

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const unmark = useCallback(() => {
    markedRef.current?.classList.remove('nav-pending')
    markedRef.current = null
  }, [])

  const finish = useCallback(() => {
    if (!activeRef.current) return
    activeRef.current = false
    clearTimers()
    unmark() // 도착 → 클릭 요소 펄스 해제
    const elapsed = Date.now() - startAtRef.current
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed)
    const t1 = setTimeout(() => {
      setPhase('done')
      const t2 = setTimeout(() => {
        setPhase('idle')
        setPendingHref(null)
      }, 400) // 완료 애니메이션(100%→페이드) 여유
      timersRef.current.push(t2)
    }, wait)
    timersRef.current.push(t1)
  }, [clearTimers, unmark])

  const start = useCallback(
    (href?: string) => {
      clearTimers()
      activeRef.current = true
      startAtRef.current = Date.now()
      setPendingHref(href ?? null)
      setRunId((n) => n + 1)
      setPhase('active')
      timersRef.current.push(setTimeout(finish, MAX_DURATION_MS))
    },
    [clearTimers, finish],
  )

  // 경로 실제 변경 → 완료 (초기 마운트/무변경 스킵)
  useEffect(() => {
    if (prevPathRef.current === pathname) return
    prevPathRef.current = pathname
    finish()
  }, [pathname, finish])

  // 언마운트 정리
  useEffect(() => () => { clearTimers(); unmark() }, [clearTimers, unmark])

  // 전역 위임 클릭 리스너 — 모든 내부 <a> 좌클릭을 자동 감지(capture라 링크 핸들러보다 먼저).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as Element | null)?.closest?.('a')
      if (!anchor) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const rel = anchor.getAttribute('rel')
      if (rel && rel.includes('external')) return
      const raw = anchor.getAttribute('href')
      if (!raw || raw.startsWith('#')) return
      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return // 외부/크로스앱 = 전체 로드(브라우저가 표시)
      if (url.pathname === window.location.pathname) return // 동일 경로(해시/쿼리만) = 스킵
      // 클릭한 <a>에 로컬 pending 펄스 부여(전환 완료/다음 클릭 시 해제) — 컴포넌트 수정 0
      unmark()
      anchor.classList.add('nav-pending')
      markedRef.current = anchor
      start(url.pathname + url.search)
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [start, unmark])

  return (
    <NavProgressContext.Provider value={{ start, pendingHref }}>
      {children}
      <TopProgressBar phase={phase} runId={runId} />
    </NavProgressContext.Provider>
  )
}

/** 상단 진행바 — 비주얼 전용(문구 없음). 장식이므로 스크린리더에서 숨김(전환 안내는 페이지가 담당). */
function TopProgressBar({ phase, runId }: { phase: Phase; runId: number }) {
  if (phase === 'idle') return null
  return (
    <div
      key={runId}
      aria-hidden="true"
      className={`nav-progress ${phase === 'active' ? 'nav-progress--active' : 'nav-progress--done'}`}
    />
  )
}
