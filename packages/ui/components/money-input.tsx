'use client'

import { useState } from 'react'

/**
 * 원화 금액 입력 — 입력 즉시 천 단위 콤마 표시.
 * 화면에는 "500,000"으로 보이고, 폼 제출은 hidden input의 숫자만("500000") 전달된다.
 */
export function MoneyInput({
  id,
  name,
  defaultValue,
  placeholder,
  required,
  className,
}: {
  id?: string
  name: string
  defaultValue?: number | null
  placeholder?: string
  required?: boolean
  className?: string
}) {
  const [display, setDisplay] = useState(
    defaultValue != null ? defaultValue.toLocaleString('ko-KR') : ''
  )
  const raw = display.replace(/[^0-9]/g, '')

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        required={required}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, '')
          setDisplay(digits ? Number(digits).toLocaleString('ko-KR') : '')
        }}
        placeholder={placeholder}
        className={className}
      />
      <input type="hidden" name={name} value={raw} />
    </>
  )
}
