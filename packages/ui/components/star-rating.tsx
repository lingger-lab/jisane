import { Star } from 'lucide-react'
import { cn } from '../lib/cn'

/**
 * 별점 표시 — lucide Star(채움=앰버 accent / 빈=border-light). 유니코드 ★☆ 텍스트 대체(A3).
 * 표시 전용(비인터랙티브). value=채워진 개수, max=총 개수(기본 5).
 */
export function StarRating({
  value,
  max = 5,
  className,
}: {
  value: number
  max?: number
  className?: string
}) {
  const filled = Math.max(0, Math.min(max, Math.round(value)))
  return (
    <span className={cn('inline-flex items-center gap-0.5 align-middle', className)} aria-label={`${filled}/${max}점`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn('h-4 w-4', i < filled ? 'text-accent' : 'text-border-light')}
          strokeWidth={1.75}
          fill={i < filled ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}
