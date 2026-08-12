import * as React from 'react'
import { cn } from '../../lib/cn'
import { fieldBase, toneRing, type FieldTone } from './input'

/**
 * 셀렉트 프리미티브 — Input과 같은 필드 스타일. 네이티브 select(브라우저 화살표 유지). 서버 안전.
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  tone?: FieldTone
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, tone = 'primary', children, ...props }, ref) => (
    <select ref={ref} className={cn(fieldBase, toneRing[tone], className)} {...props}>
      {children}
    </select>
  ),
)
Select.displayName = 'Select'
