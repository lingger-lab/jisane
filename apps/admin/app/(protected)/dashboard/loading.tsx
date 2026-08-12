import { PageHero } from '@jisane/ui/page-hero'
// 탭 구성은 실제 탭바(dashboard-tabs.tsx)와 공유하는 단일 소스 — 개수 드리프트 방지
import { TAB_GROUPS } from './dashboard-tab-groups'

/**
 * 실제 페이지(page.tsx)의 골격을 그대로 미러링한 스켈레톤.
 * 카드·탭 개수가 실제와 어긋나면 데이터 도착 시 레이아웃이 리플로우해 스켈레톤의
 * 목적(안정된 체감 레이아웃)이 무너진다(감사 docs/10 P3-5).
 * SUMMARY_CARD_COUNT는 page.tsx의 SummaryCard 개수와 함께 움직여야 한다.
 */
const SUMMARY_CARD_COUNT = 9

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col" role="status" aria-busy="true" aria-label="대시보드 불러오는 중">
      {/* PageHero는 정적 콘텐츠 — 실제 페이지와 동일하게 렌더해 헤더 시프트 제거 (문구는 page.tsx와 동일 유지) */}
      <PageHero eyebrow="관리자" title="대시보드" />
      <div className="px-4 py-6 sm:px-6">
        {/* 요약 카드 — page.tsx와 동일 그리드 (grid 클래스 변경 시 여기도 함께) */}
        <div className="mb-6 grid grid-cols-3 gap-3 md:grid-cols-5">
          {Array.from({ length: SUMMARY_CARD_COUNT }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border-light bg-surface p-4 text-center shadow-sm"
            >
              <div className="mx-auto h-4 w-12 animate-pulse rounded bg-border-light" />
              <div className="mx-auto mt-1 h-7 w-14 animate-pulse rounded-lg bg-border-light" />
            </div>
          ))}
        </div>

        {/* 4그룹 탭바 — 실제 라벨을 투명 텍스트로 렌더해 폭까지 일치시킨다 */}
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-surface p-1">
          {TAB_GROUPS.map((group, gi) => (
            <div key={group.label} className="flex items-center">
              {gi > 0 && <div aria-hidden="true" className="mx-0.5 h-6 w-px shrink-0 bg-border" />}
              <div className="flex gap-0.5">
                {group.tabs.map((tab) => (
                  <div
                    key={tab.key}
                    className="shrink-0 select-none animate-pulse rounded-md bg-border-light px-3 py-2 text-sm font-medium text-transparent"
                  >
                    {tab.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 콘텐츠 영역 */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border-light bg-surface"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
