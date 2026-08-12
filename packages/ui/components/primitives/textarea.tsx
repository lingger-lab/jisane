import * as React from 'react'
import { cn } from '../../lib/cn'
import { fieldBase, toneRing, type FieldTone } from './input'

/**
 * 텍스트영역 프리미티브 — Input과 같은 필드 스타일 + 최소 높이. 서버 안전.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  tone?: FieldTone
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, tone = 'primary', ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(fieldBase, toneRing[tone], 'min-h-24 resize-none leading-relaxed', className)}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
