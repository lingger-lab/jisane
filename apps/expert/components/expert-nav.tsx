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

export function ExpertNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border-light bg-background/80 backdrop-blur-lg pb-safe">
      <div className="container-app flex items-center justify-around px-4 md:px-6">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-xs md:text-sm transition-colors ${
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
