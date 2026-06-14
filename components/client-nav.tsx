'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/', label: '홈' },
  { href: '/request', label: '일 맡기기' },
  { href: '/status', label: '의뢰 현황' },
] as const

export function ClientNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-1">
        {TABS.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-sm transition-colors ${
                isActive ? 'font-semibold text-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
        <Link
          href="/matching"
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-sm font-medium text-accent transition-colors hover:text-accent/80"
        >
          파트너 전환
        </Link>
      </div>
    </nav>
  )
}
