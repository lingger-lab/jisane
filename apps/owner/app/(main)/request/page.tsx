import { fetchOwnerLandingStats } from '@jisane/shared/landing-stats'
import { CategoryBrowse } from '@jisane/ui/category-browse'
import { SearchBox } from '@jisane/ui/search-box'
import { RequestForm } from './request-form'

export default async function RequestPage() {
  const stats = await fetchOwnerLandingStats()

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <h1 className="mb-2 text-2xl font-bold text-primary">일 맡기기</h1>
      <p className="mb-6 text-sm text-text-muted">
        먼저 시니어지식인을 찾아보거나, 바로 의뢰서를 작성하세요.
      </p>

      {/* 시니어지식인 먼저 찾기 — 검색 + 카테고리 (→ /experts) */}
      <section className="mb-8">
        <SearchBox target="/experts" placeholder="이름·분야로 시니어지식인 검색" />
        <div className="mt-4">
          <CategoryBrowse
            categoryCounts={stats.categoryCounts}
            newRequestsThisMonth={stats.newRequestsThisMonth}
            title="어떤 분야의 시니어지식인이 필요하세요?"
            countLabel="시니어지식인"
            countUnit="명"
            colorToken="primary"
            baseHref="/experts"
          />
        </div>
      </section>

      {/* 의뢰서 작성 */}
      <section>
        <h2 className="mb-4 text-base font-bold text-text">의뢰서 작성</h2>
        <RequestForm />
      </section>
    </div>
  )
}
