import Link from 'next/link'
import { getAllPublishedPackages } from '@jisane/shared/service-package/queries'
import { pickShowcase, filterCatalog } from '@jisane/shared/service-package/showcase'
import { formatPackagePrice, CATEGORY_LABELS, type ServiceCategory, type ServicePackage } from '@jisane/shared/service-catalog'
import { pageMetadata } from '@jisane/shared/seo'
import { PageHero } from '@jisane/ui/page-hero'
import { ServiceBanner } from '@jisane/ui/service-banner'
import { ServiceCarousel, type ServiceCarouselItem } from '@jisane/ui/service-carousel'
import { SearchBox } from '@jisane/ui/search-box'
import { Badge } from '@jisane/ui/badge'
import { CatalogFilter } from './catalog-filter'

export const metadata = pageMetadata('admin', {
  title: '지식서비스',
  description: '시니어지식인·전문가·지사네가 제공하는 지식서비스를 한곳에서 둘러보세요.',
  path: '/knowledge',
})

function toCarouselItem(pkg: ServicePackage): ServiceCarouselItem {
  return {
    key: pkg.slug,
    href: `/knowledge/${pkg.slug}`,
    name: pkg.name,
    provider: pkg.provider,
    bannerUrl: pkg.bannerUrl ?? null,
    priceLabel: formatPackagePrice(pkg),
    categoryLabel: CATEGORY_LABELS[pkg.category],
    isOfficial: pkg.isOfficial,
    isFree: pkg.isFree,
  }
}

export default async function KnowledgeHubPage(props: {
  searchParams: Promise<{ q?: string; cat?: string }>
}) {
  const { q, cat } = await props.searchParams
  const packages = await getAllPublishedPackages()

  const showcase = pickShowcase(packages, 9).map(toCarouselItem)
  const catParam = (cat as ServiceCategory | 'all' | undefined) ?? 'all'
  const filtered = filterCatalog(packages, { q, cat: catParam })

  return (
    <div className="flex flex-1 flex-col">
      <PageHero
        container="marketing"
        eyebrow="지식서비스"
        title="지사네 지식서비스"
        subtitle="시니어지식인·전문가·지사네가 제공하는 전문 서비스를 한곳에서"
        size="lg"
      />
      <div className="container-marketing flex flex-col gap-8 px-4 md:px-6 py-8 md:py-12">
        {packages.length === 0 ? (
          <div className="rounded-xl border border-border-light bg-card p-10 text-center">
            <p className="text-sm text-text-muted">아직 공개된 지식서비스가 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 추천 캐러셀 — featured·최신 대표 */}
            {showcase.length > 0 && <ServiceCarousel items={showcase} title="추천 지식서비스" />}

            {/* 검색 + 카테고리 필터 */}
            <div className="flex flex-col gap-3">
              <div className="max-w-md">
                <SearchBox
                  target="/knowledge"
                  placeholder="서비스·제공자·내용으로 검색"
                  defaultValue={q ?? ''}
                  extraParams={cat && cat !== 'all' ? { cat } : {}}
                />
              </div>
              <CatalogFilter cat={cat ?? 'all'} q={q} />
            </div>

            {/* 전체 그리드 */}
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-light bg-card p-10 text-center">
                <p className="text-sm text-text-muted">조건에 맞는 지식서비스가 없습니다.</p>
                <Link href="/knowledge" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                  전체 보기 &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((pkg) => (
                  <Link
                    key={pkg.slug}
                    href={`/knowledge/${pkg.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border-light bg-card shadow-xs card-hover transition-colors hover:border-primary/30"
                  >
                    <div className="relative">
                      <ServiceBanner src={pkg.bannerUrl} sizes="(max-width: 640px) 100vw, 360px" />
                      {pkg.isOfficial && (
                        <span className="absolute left-2 top-2 rounded bg-primary/90 px-1.5 py-0.5 text-[11px] font-medium text-white">
                          지사네 공식
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center gap-2">
                        <h3 className="min-w-0 truncate font-semibold text-text">{pkg.name}</h3>
                        {pkg.isFree && <Badge variant="accent">무료</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-text-subtle">
                        {CATEGORY_LABELS[pkg.category]} · {pkg.provider}
                      </p>
                      <p className="mt-1 flex-1 text-sm text-text-muted leading-relaxed line-clamp-2">
                        {pkg.valueDesc || pkg.description}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-primary">{formatPackagePrice(pkg)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
