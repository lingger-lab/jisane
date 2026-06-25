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
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border-light bg-background/80 backdrop-blur-lg pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-1">
        <span className="absolute left-2 top-1 text-[10px] font-semibold text-primary/50">기업공간</span>
        {TABS.map((tab) => {
          const isActive = tab.href === '/'
            ? pathname === '/'
            : pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-sm transition-colors ${
                isActive ? 'font-semibold text-primary' : 'text-text-muted hover:text-text'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-accent" />
              )}
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
