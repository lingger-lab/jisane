'use client'

import { useFormStatus } from 'react-dom'
import { Button, type ButtonProps } from './primitives/button'

interface SubmitButtonProps {
  children: React.ReactNode
  className?: string
  /** 지정 시 Button 프리미티브로 렌더(권장). 미지정 시 className 기반 레거시 렌더(하위호환). */
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
}

/**
 * 폼 제출 버튼 — useFormStatus로 pending 시 비활성 + 스피너. WCAG: pending 상태 시각/낭독.
 * variant를 주면 Button 프리미티브(일관 토큰)로, 없으면 기존 className 스타일을 그대로 유지한다.
 */
export function SubmitButton({ children, className, variant, size }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  const content = pending ? (
    <span className="flex items-center justify-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
      처리 중...
    </span>
  ) : (
    children
  )

  if (variant) {
    return (
      <Button type="submit" variant={variant} size={size} disabled={pending} className={className}>
        {content}
      </Button>
    )
  }

  // 레거시 — 호출처 className으로 스타일(기존 동작 보존)
  return (
    <button type="submit" disabled={pending} className={`btn-press focus-ring ${className ?? ''}`}>
      {content}
    </button>
  )
}
