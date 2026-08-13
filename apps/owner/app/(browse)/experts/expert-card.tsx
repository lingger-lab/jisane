import Link from 'next/link'
import { EXPERT_GRADE_LABELS } from '@jisane/shared/labels'

export interface ExpertCardData {
  id: string
  name: string | null
  field: string | null
  careerYears: number | null
  grade: string
  totalScore: number | null
  activityPoints: number
  categories?: string[]
}

/** 시니어지식인 카드 — 리스트·홈 추천·의뢰하기 미리보기 공용 */
export function ExpertCard({ expert, className = '' }: { expert: ExpertCardData; className?: string }) {
  return (
    <Link
      href={`/experts/${expert.id}`}
      className={`rounded-xl border border-border-light p-4 md:p-5 shadow-xs card-hover block ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-text">{expert.name ?? '시니어지식인'}</h3>
          {expert.field && <p className="mt-0.5 text-xs text-text-muted">{expert.field}</p>}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            expert.grade === 'veteran'
              ? 'bg-primary/10 text-primary'
              : expert.grade === 'new'
                ? 'bg-surface text-text-subtle'
                : 'bg-primary/5 text-primary/80'
          }`}
        >
          {EXPERT_GRADE_LABELS[expert.grade] ?? expert.grade}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
        {expert.totalScore != null && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 font-bold text-accent">
            {expert.totalScore.toFixed(1)}점
          </span>
        )}
        {expert.careerYears != null && expert.careerYears > 0 && (
          <span className="font-medium text-primary">경력 {expert.careerYears}년</span>
        )}
        {expert.activityPoints > 0 && <span className="text-warning">활동 +{expert.activityPoints}</span>}
      </div>
      {expert.categories && expert.categories.length > 0 && (
        <p className="mt-1 text-xs text-text-subtle truncate">
          {expert.categories.slice(0, 3).join(' · ')}
        </p>
      )}
    </Link>
  )
}
