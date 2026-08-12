import { PageHero } from '@jisane/ui/page-hero'

/**
 * /work 스켈레톤 — 목록 쿼리를 기다리는 동안 이전 화면이 멈춘 듯 보이던 문제
 * (감사 docs/10 P3-45). 실제 페이지의 PageHero·작업 카드 리스트 골격을 미러링한다.
 * PageHero 문구는 page.tsx와 동일하게 유지할 것.
 */
export default function WorkLoading() {
  return (
    <div className="flex flex-1 flex-col" role="status" aria-busy="true" aria-label="작업 현황 불러오는 중">
      <PageHero
        eyebrow="시니어지식인회원"
        title="작업 현황"
        subtitle="진행 중인 작업을 확인하고 단계를 관리하세요."
      />

      <div className="container-app px-4 md:px-6 py-6">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border-light border-l-4 border-l-border p-4 shadow-xs"
            >
              <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-border-light" />
              <div className="mb-1.5 h-3 w-1/3 animate-pulse rounded bg-border-light" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-border-light" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
