import { PageHero } from '@jisane/ui/page-hero'

/**
 * /mypage 스켈레톤 — 인증 + 6개 쿼리를 기다리는 동안 이전 화면이 멈춘 듯 보이던
 * 문제(감사 docs/10 P3-45). 실제 페이지 골격(PageHero·프로필 카드·프로필 편집·점수 카드)을
 * 미러링한다. PageHero·섹션 제목 문구는 page.tsx와 동일하게 유지할 것.
 */
export default function MyPageLoading() {
  return (
    <div className="flex flex-1 flex-col" role="status" aria-busy="true" aria-label="마이페이지 불러오는 중">
      <PageHero
        eyebrow="시니어지식인회원"
        title="마이페이지"
        subtitle="내 현황을 확인하고 프로필을 수정할 수 있습니다."
      />

      <div className="responsive-container px-4 md:px-6 py-6">
        {/* 프로필 요약 카드 */}
        <div className="mb-6 rounded-xl border border-border-light bg-surface-warm p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-border-light" />
            <div>
              <div className="h-4 w-24 animate-pulse rounded bg-border-light" />
              <div className="mt-1.5 h-3 w-36 animate-pulse rounded bg-border-light" />
            </div>
          </div>
          <div className="mt-3 flex gap-3">
            <div className="h-5 w-14 animate-pulse rounded-full bg-border-light" />
            <div className="h-5 w-28 animate-pulse rounded bg-border-light" />
          </div>
        </div>

        {/* 프로필 편집 폼 */}
        <section className="mb-8">
          <h2 className="mb-4 text-base font-bold text-text">프로필 편집</h2>
          <div className="flex flex-col gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="mb-2 h-4 w-20 animate-pulse rounded bg-border-light" />
                <div className="h-12 animate-pulse rounded-xl bg-border-light" />
              </div>
            ))}
          </div>
        </section>

        {/* 종합점수 카드 */}
        <div className="mb-6 rounded-xl border border-border-light bg-background p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-5 w-24 animate-pulse rounded bg-border-light" />
            <div className="h-7 w-12 animate-pulse rounded-lg bg-border-light" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-surface" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
