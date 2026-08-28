import * as React from 'react'
import { OwlIcon } from './icons/owl'
import { cn } from '../lib/cn'

/**
 * 아바타 — 사진(photoUrl) 있으면 그 이미지, 없으면 **자동 부엉이 모노그램**.
 * 부엉이 모노그램 = 계정 id 해시로 색 톤·2자리 숫자를 결정론적 자동 부여 + 이름 첫 글자 이니셜.
 * 같은 id=같은 결과(안정적), 사용자마다 고유. 색·숫자·변형은 자동(수동 선택 없음). 서버 안전.
 */

// 아바타 전용 큐레이션 톤 팔레트 — 한지 크림/브랜드와 조화되는 뮤트 8색(코어 토큰과 별개 장식 세트).
const OWL_TONES: readonly { bg: string; fg: string }[] = [
  { bg: '#e4ede8', fg: '#1f5c46' }, // green (브랜드 primary)
  { bg: '#f4e7d4', fg: '#b06a1e' }, // amber (브랜드 accent)
  { bg: '#dcebe8', fg: '#2b6f6a' }, // teal
  { bg: '#f0e1d9', fg: '#9c5a42' }, // clay
  { bg: '#ece0e7', fg: '#7c4a63' }, // plum
  { bg: '#e3e7ec', fg: '#495663' }, // slate
  { bg: '#eaecd8', fg: '#5f6b39' }, // olive
  { bg: '#f2e2dc', fg: '#a4513a' }, // rust
]

/** 결정론적 문자열 해시(32bit, 음수 제거) */
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

type AvatarSize = 'sm' | 'md' | 'lg'
const SIZES: Record<AvatarSize, { box: string; owl: string; text: string }> = {
  sm: { box: 'h-10 w-10', owl: 'h-5 w-5', text: 'text-[8px]' },
  md: { box: 'h-12 w-12', owl: 'h-6 w-6', text: 'text-[9px]' },
  lg: { box: 'h-16 w-16', owl: 'h-9 w-9', text: 'text-[11px]' },
}

export interface AvatarProps {
  /** 계정 고유 id — 색·숫자 파생의 안정적 시드 */
  id: string
  /** 표시 이름(활동명 등) — 첫 글자를 이니셜로 */
  name?: string | null
  /** 업로드 사진 URL(있으면 최우선). Phase 2 */
  photoUrl?: string | null
  size?: AvatarSize
  className?: string
}

export function Avatar({ id, name, photoUrl, size = 'md', className }: AvatarProps) {
  const s = SIZES[size]

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className={cn('shrink-0 rounded-full object-cover', s.box, className)}
      />
    )
  }

  const h = hashStr(id || name || '?')
  const tone = OWL_TONES[h % OWL_TONES.length]
  const num = String(h % 100).padStart(2, '0')
  const initial = (name?.trim()?.[0] || '?').toUpperCase()

  return (
    <div
      className={cn('flex shrink-0 flex-col items-center justify-center rounded-full', s.box, className)}
      style={{ background: tone.bg }}
      aria-hidden="true"
    >
      <span style={{ color: tone.fg }} className="leading-none">
        <OwlIcon className={s.owl} />
      </span>
      <span className={cn('mt-0.5 font-bold leading-none tabular-nums', s.text)} style={{ color: tone.fg }}>
        {initial}
        {num}
      </span>
    </div>
  )
}
