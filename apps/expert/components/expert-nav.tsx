'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Bell, ClipboardList, GraduationCap, UserRound } from 'lucide-react'

const TABS = [
  { href: '/', label: '홈', Icon: Home },
  { href: '/invitations', label: '초빙', Icon: Bell },
  { href: '/work', label: '작업', Icon: ClipboardList },
  { href: '/education', label: '교육', Icon: GraduationCap },
  { href: '/mypage', label: '프로필', Icon: UserRound },
] as const

function isTabActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

/** 모바일 하단 탭바 — 데스크탑(md↑)에선 숨기고 헤더 내비(ExpertHeaderNav)로 대체. */
export function ExpertNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-light bg-background/80 backdrop-blur-lg pb-safe md:hidden">
      <div className="container-app flex items-center justify-around px-4 md:px-6">
        {TABS.map((tab) => {
          const isActive = isTabActive(pathname, tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                isActive ? 'font-semibold text-accent' : 'text-text-muted hover:text-text'
              }`}
            >
              {isActive && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-accent" />}
              <tab.Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/** 데스크탑 헤더 주요 내비 — 모바일(md 미만)에선 숨김(하단탭이 대체). AppHeader centerNav 슬롯에 배치. */
export function ExpertHeaderNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {TABS.map((tab) => {
        const isActive = isTabActive(pathname, tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              isActive ? 'bg-accent/10 font-semibold text-accent' : 'text-text-muted hover:bg-surface hover:text-text'
            }`}
          >
            <tab.Icon className="h-4 w-4" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
