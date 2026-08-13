'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

/**
 * 버튼 프리미티브 (shadcn 도입, 설계 docs/16 §12.2).
 * jisane 시맨틱 토큰 위에 CVA로 변형 구성. 기존 `btn-press`/`focus-ring` 유틸(globals.css)과 일관.
 * white 텍스트는 primary ≥600에서만(AA) — 기본 primary(700) 7.84:1.
 */
const buttonVariants = cva(
  'btn-press focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors duration-[var(--duration-base)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-600 active:bg-primary-800',
        outline: 'border border-border bg-surface-warm text-text hover:bg-surface',
        ghost: 'text-text hover:bg-surface',
        danger: 'bg-error-solid text-white hover:brightness-95 active:brightness-90',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-11 px-5',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** true면 자식 요소(예: <a>·<Link>)에 스타일을 위임(Radix Slot). */
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        // asChild면 자식이 요소 타입을 정하므로 button 전용 type을 강제하지 않는다.
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
