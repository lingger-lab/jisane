import { PageHero } from '@jisane/ui/page-hero'

/**
 * 실제 /status 페이지 골격을 미러링한 스켈레톤 — PageHero 밴드·컨테이너 패딩·두 섹션.
 * 헤더가 히어로 밴드와 다르면 데이터 도착 시 화면이 눈에 띄게 재구성된다(감사 docs/10 P3-73).
 * PageHero·섹션 제목 문구는 page.tsx와 동일하게 유지할 것.
 */
export default function StatusLoading() {
  return (
    <div className="flex flex-1 flex-col" role="status" aria-busy="true" aria-label="의뢰 현황 불러오는 중">
      <PageHero
        eyebrow="기업회원"
        title="의뢰 현황"
        subtitle="등록한 의뢰와 전문서비스 진행 상태를 한눈에 확인하세요."
      />

      <div className="container-app px-4 md:px-6 py-6">
        {/* 요약 카드 2개 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border-light bg-surface-warm p-4 text-center"
            >
              <div className="mx-auto h-8 w-10 animate-pulse rounded-lg bg-border-light" />
              <div className="mx-auto mt-1 h-4 w-16 animate-pulse rounded bg-border-light" />
            </div>
          ))}
        </div>

        {/* 새 의뢰 CTA 자리 */}
        <div className="mb-6 h-12 animate-pulse rounded-xl bg-border-light" />

        {/* 의뢰 리스트 */}
        <h2 className="mb-3 text-base font-bold text-text">의뢰 현황</h2>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border-light border-l-4 border-l-border p-4 shadow-xs"
            >
              <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-border-light" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-border-light" />
            </div>
          ))}
        </div>

        {/* 전문서비스 현황 */}
        <h2 className="mb-3 mt-8 text-base font-bold text-text">전문서비스 현황</h2>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border-light border-l-4 border-l-border p-4 shadow-xs"
            >
              <div className="mb-2 h-5 w-2/3 animate-pulse rounded bg-border-light" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-border-light" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
