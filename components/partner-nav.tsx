'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'

const TABS = [
  { href: '/matching', label: '제안' },
  { href: '/work', label: '작업' },
] as const

export function PartnerNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
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
        <form action={signOut} className="flex flex-1 justify-center">
          <button
            type="submit"
            className="py-1 text-xs text-text-muted transition-colors hover:text-text"
          >
            로그아웃
          </button>
        </form>
      </div>
    </nav>
  )
}
