import * as React from 'react'
import { cn } from '../../lib/cn'

/**
 * 인풋 프리미티브 (설계 docs/16 §12.1). 기존 focus-ring 유틸과 일관, 터치 타겟 h-11(≥44px 근접).
 * placeholder는 AA 검증된 --text-subtle 사용.
 */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'focus-ring flex h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface-warm px-3 text-sm text-text',
        'placeholder:text-text-subtle disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
