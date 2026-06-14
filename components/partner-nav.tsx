'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: '홈' },
  { href: '/matching', label: '제안' },
  { href: '/work', label: '작업' },
  { href: '/mypage', label: '마이' },
] as const

export function PartnerNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
        {TABS.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-xs transition-colors ${
                isActive ? 'font-semibold text-accent' : 'text-text-muted hover:text-text'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
        <Link
          href="/request"
          className="flex flex-1 flex-col items-center gap-0.5 py-1 text-xs font-medium text-primary transition-colors hover:text-primary-light"
        >
          사장님 전환
        </Link>
      </div>
    </nav>
  )
}
