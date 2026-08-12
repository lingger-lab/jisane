import { cn } from '../lib/cn'

/**
 * 무료 운영 기간 안내 — **조용한 한 줄**(설계 docs/16 §0). 랜딩에서 강조하지 않고,
 * 요금·정책 안내 페이지에서만 자연스럽게 고지한다. **금액·요율은 노출하지 않는다**.
 *
 * 표시 종료일은 `NEXT_PUBLIC_FREE_UNTIL`(단일 소스). 미설정이거나 지난 날짜면 렌더하지 않는다.
 * ⚠️ **표시 전용** — 금전 판단(무료 경로 활성)은 서버 `isFreeModeEnabled()`(FREE_MODE_UNTIL)가 단일 진실.
 */
export function FreePeriodBanner({ className }: { className?: string }) {
  const until = process.env.NEXT_PUBLIC_FREE_UNTIL
  if (!until) return null

  const untilTime = Date.parse(`${until}T23:59:59+09:00`)
  if (Number.isNaN(untilTime) || Date.now() > untilTime) return null

  const label = new Date(untilTime).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <p className={cn('text-xs text-text-muted', className)}>
      <span className="font-medium text-primary-700">현재 이용 무료</span>
      {` · ${label}까지 구독료·수수료 없이 이용하실 수 있습니다.`}
    </p>
  )
}
