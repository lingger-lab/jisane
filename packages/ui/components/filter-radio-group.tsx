'use client'

import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { nextRovingIndex, rovingTabIndex } from './roving-focus'

export interface FilterRadioOption<T extends string> {
  value: T
  label: ReactNode
  /** 시각 라벨이 텍스트가 아닐 때(별점 ★ 등) 보조기기용 이름 */
  ariaLabel?: string
}

/**
 * 배타 선택 버튼 그룹의 접근성 프리미티브 — WAI-ARIA APG radio group 패턴.
 * role=radiogroup/radio + aria-checked + 로빙 탭인덱스 + 화살표/Home/End 이동.
 * 시각 디자인은 호출처가 optionClassName으로 그대로 유지한다(시맨틱·키보드만 담당).
 * Space/Enter 활성화는 네이티브 button 클릭으로 동작한다.
 */
export function FilterRadioGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  optionClassName,
  selectOnArrow = false,
}: {
  options: readonly FilterRadioOption<T>[]
  value: T | null
  onChange: (value: T) => void
  /** radiogroup의 접근성 이름 */
  label: string
  /** 컨테이너 클래스 — 기존 레이아웃 유지 */
  className?: string
  /** 옵션별 클래스 — 기존 시각 디자인 유지 */
  optionClassName: (selected: boolean, value: T) => string
  /**
   * true: 화살표 이동이 곧 선택(로컬 상태 필터·별점 — APG 기본형).
   * false(기본): 화살표는 포커스만 이동, Space/Enter로 선택 —
   * 선택이 내비게이션/서버 왕복을 유발하는 그룹에서 다중 발화를 막는다.
   */
  selectOnArrow?: boolean
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const selectedIndex = options.findIndex((o) => o.value === value)

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = nextRovingIndex(e.key, index, options.length)
    if (next === null) return
    e.preventDefault()
    refs.current[next]?.focus()
    if (selectOnArrow && next !== selectedIndex) onChange(options[next].value)
  }

  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {options.map((opt, i) => (
        <button
          key={opt.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={opt.value === value}
          aria-label={opt.ariaLabel}
          tabIndex={rovingTabIndex(i, selectedIndex)}
          onClick={() => onChange(opt.value)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className={optionClassName(opt.value === value, opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
