import { fetchOwnerLandingStats } from '@jisane/shared/landing-stats'
import { CategoryBrowse } from '@jisane/ui/category-browse'
import { SearchBox } from '@jisane/ui/search-box'
import { PageHero } from '@jisane/ui/page-hero'
import { RequestForm } from './request-form'

export default async function RequestPage() {
  const stats = await fetchOwnerLandingStats()

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero container="form" eyebrow="기업회원" title="일 맡기기" subtitle="먼저 시니어지식인을 찾아보거나, 바로 의뢰서를 작성하세요." />

      <div className="container-form px-4 md:px-6 py-6">
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
        <h2 className="mb-4 text-lg font-serif font-bold text-text">의뢰서 작성</h2>
        <RequestForm />
      </section>
      </div>
    </div>
  )
}
