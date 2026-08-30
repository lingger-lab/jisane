import { CircleCheck } from 'lucide-react'
import { cn } from '../lib/cn'

/**
 * "상담=무료" 마찰제거 microcopy — 가격이 '상담 문의'(sentinel)인 서비스에만 노출.
 * variant=pill: 가격 라인 옆 배지, variant=inline: 문장형(동의 블록 위·목록 노트). primary 토큰만.
 */
export function FreeConsultNote({
  variant = 'inline',
  label,
  className,
}: {
  variant?: 'pill' | 'inline'
  label?: string
  className?: string
}) {
  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary',
          className,
        )}
      >
        <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
        {label ?? '무료 상담'}
      </span>
    )
  }
  return (
    <p className={cn('inline-flex items-center gap-1.5 text-xs text-text-muted', className)}>
      <CircleCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      {label ?? '상담 신청은 무료입니다'}
    </p>
  )
}
