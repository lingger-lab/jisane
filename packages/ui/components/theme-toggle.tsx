'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '../lib/cn'

type Theme = 'light' | 'dark' | 'system'

const ORDER: Theme[] = ['light', 'dark', 'system']
const LABELS: Record<Theme, string> = { light: '라이트', dark: '다크', system: '시스템' }
const ICONS: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor }

/**
 * 테마 토글 — 라이트 → 다크 → 시스템 순환. localStorage('theme')에 지속.
 * 명시 선택은 <html data-theme>로 스탬프, '시스템'은 속성 제거 → prefers-color-scheme 추종.
 * 초기값은 'system'이라 서버/첫 클라이언트 렌더가 일치(하이드레이션 안전) — 마운트 후 저장값 반영.
 * 페인트 전 실제 적용은 각 앱 layout <head>의 인라인 스크립트가 담당(플래시 방지).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    setTheme(stored === 'light' || stored === 'dark' ? stored : 'system')
  }, [])

  function apply(next: Theme) {
    setTheme(next)
    if (next === 'system') {
      localStorage.removeItem('theme')
      document.documentElement.removeAttribute('data-theme')
    } else {
      localStorage.setItem('theme', next)
      document.documentElement.setAttribute('data-theme', next)
    }
  }

  const nextTheme = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
  const Icon = ICONS[theme]

  return (
    <button
      type="button"
      onClick={() => apply(nextTheme)}
      aria-label={`화면 테마: ${LABELS[theme]} · 클릭하면 ${LABELS[nextTheme]}로 전환`}
      title={`화면 테마: ${LABELS[theme]} · 클릭하면 ${LABELS[nextTheme]}로 전환`}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-light px-2 text-text-muted transition-colors hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <span className="text-xs font-medium">{LABELS[theme]}</span>
    </button>
  )
}
