import * as React from 'react'
import { cn } from '../../lib/cn'

/**
 * 폼 필드 프리미티브 (설계 docs/16 §12.1). 앱 전반의 손코딩 폼 필드 스타일을 단일 소스로.
 * 포커스 색은 앱 테마별 tone(기업=primary · 시니어=accent · 파트너=partner)로 선택. 서버 안전.
 * ※ info(파랑)는 시맨틱 알림 전용 — 파트너 폼엔 partner(그래파이트) 톤을 쓴다(감사 P1-4, 토큰 계약 준수).
 */
export type FieldTone = 'primary' | 'accent' | 'info' | 'partner'

export const fieldBase =
  'w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle transition-colors focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50'

export const toneRing: Record<FieldTone, string> = {
  primary: 'focus:border-primary focus:ring-primary/20',
  accent: 'focus:border-accent focus:ring-accent/20',
  info: 'focus:border-info focus:ring-info/20',
  partner: 'focus:border-partner focus:ring-partner/20',
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tone?: FieldTone
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, tone = 'primary', ...props }, ref) => (
    <input ref={ref} type={type} className={cn(fieldBase, toneRing[tone], className)} {...props} />
  ),
)
Input.displayName = 'Input'
