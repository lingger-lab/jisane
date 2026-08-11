'use client'

import { useRouter } from 'next/navigation'
import { useSeededState } from './use-seeded-state'

/**
 * 검색 입력 — 제출 시 `${target}?q=검색어`로 이동. extraParams로 기존 필터(카테고리 등) 보존.
 * 홈·의뢰하기(→/experts)와 /experts 내부 검색에 공용.
 *
 * defaultValue는 URL(진실원)에서 내려오는 시드다. URL의 q가 바뀌면(뒤로가기,
 * q를 지우는 필터 링크 등) 입력값을 재동기화하고, 입력 중(prop 불변)에는
 * 절대 리셋하지 않는다 (감사 UX P2-51 / 코드 P3-118).
 */
export function SearchBox({
  target,
  placeholder = '검색',
  defaultValue = '',
  paramName = 'q',
  extraParams = {},
  colorToken = 'primary',
}: {
  target: string
  placeholder?: string
  defaultValue?: string
  paramName?: string
  extraParams?: Record<string, string>
  colorToken?: 'primary' | 'accent'
}) {
  const router = useRouter()
  const [value, setValue] = useSeededState(defaultValue, (v) => v)

  const focus = colorToken === 'accent'
    ? 'focus:border-accent focus:ring-accent/20'
    : 'focus:border-primary focus:ring-primary/20'

  function submit() {
    const params = new URLSearchParams(extraParams)
    const q = value.trim()
    if (q) params.set(paramName, q)
    else params.delete(paramName)
    const qs = params.toString()
    router.push(qs ? `${target}?${qs}` : target)
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit() }}
      className="relative"
      role="search"
    >
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.34-4.34m0 0A7 7 0 1 0 6.71 6.71a7 7 0 0 0 9.95 9.95Z" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`w-full rounded-xl border border-border-light bg-background py-3 pl-10 pr-20 text-sm text-text placeholder:text-text-subtle focus:ring-1 focus:outline-none transition-colors ${focus}`}
      />
      <button
        type="submit"
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-3.5 py-1.5 text-sm font-medium text-white transition-colors ${
          colorToken === 'accent' ? 'bg-accent hover:bg-accent/90' : 'bg-primary hover:bg-primary-light'
        }`}
      >
        검색
      </button>
    </form>
  )
}
