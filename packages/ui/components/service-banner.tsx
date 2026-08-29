import Image from 'next/image'
import { OwlIcon } from './icons/owl'
import { cn } from '../lib/cn'

/**
 * 지식서비스 배너 표시 — 카드·상세·공개 허브 공용. src 있으면 next/image(16:9), 없으면
 * 브랜드 그라데이션 + 부엉이 폴백(팔레트 토큰만). 서버 안전.
 */
export function ServiceBanner({
  src,
  alt = '',
  className,
  sizes = '(max-width: 768px) 100vw, 480px',
}: {
  src?: string | null
  alt?: string
  className?: string
  sizes?: string
}) {
  // env(NEXT_PUBLIC_SUPABASE_URL)에 섞인 CR/LF·공백이 URL 중간에 박혀 이미지가 깨진 사고가 있었다.
  // URL은 공백을 포함할 수 없으므로 모든 공백문자를 제거해 이미 저장된 값도 안전하게 렌더한다.
  const cleanSrc = src ? src.replace(/\s+/g, '') : src
  if (cleanSrc) {
    return (
      <div className={cn('relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface', className)}>
        <Image src={cleanSrc} alt={alt} fill sizes={sizes} className="object-cover" />
      </div>
    )
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-gradient-to-br from-surface-warm to-primary/10',
        className,
      )}
    >
      <OwlIcon className="h-10 w-10 text-primary/40" />
    </div>
  )
}
