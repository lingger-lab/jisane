import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind 클래스 병합 유틸 (shadcn 도입 기반, 설계 docs/16 §12.2).
 * 조건부 클래스(clsx)를 합친 뒤, 충돌하는 Tailwind 유틸을 뒤쪽 우선으로 정리(tailwind-merge)한다.
 * 예: cn('px-2 py-1', condition && 'px-4') → 'py-1 px-4'.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
