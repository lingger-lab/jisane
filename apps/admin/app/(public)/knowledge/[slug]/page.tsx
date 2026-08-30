import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPackageBySlug } from '@jisane/shared/service-package/queries'
import { formatPackagePrice, isConsultEligible, isConsultPriced, CATEGORY_LABELS } from '@jisane/shared/service-catalog'
import { pageMetadata, serviceJsonLd, breadcrumbJsonLd, SITES } from '@jisane/shared/seo'
import { PageHero } from '@jisane/ui/page-hero'
import { ServiceBanner } from '@jisane/ui/service-banner'
import { Badge } from '@jisane/ui/badge'
import { JsonLd } from '@jisane/ui/json-ld'
import { ConsultInquiryForm } from '@jisane/ui/consult-inquiry-form'
import { FreeConsultNote } from '@jisane/ui/free-consult-note'
import { submitHubConsultInquiry } from '@/lib/consultation/public-actions'
import { OWNER_URL, EXPERT_URL } from '@/lib/urls'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pkg = await getPackageBySlug(slug)
  if (!pkg) return { title: '지식서비스 | 지사네' }
  // 허브(/knowledge/[slug])를 카탈로그 항목의 canonical로 — owner/expert 중복 상세는 여기로 집약.
  const meta = pageMetadata('admin', {
    title: pkg.name,
    description: pkg.valueDesc || pkg.description.slice(0, 120),
    path: `/knowledge/${slug}`,
    ...(pkg.bannerUrl ? { image: pkg.bannerUrl } : {}),
  })
  // 배너 있으면 배너를 OG로(실제 이미지). 없으면 metadata 이미지를 비워 파일기반 동적 OG 카드
  // (opengraph-image.tsx)가 og:image를 공급하게 한다(generic 기본 OG 대신 브랜드 텍스트 카드).
  if (!pkg.bannerUrl) {
    if (meta.openGraph) delete (meta.openGraph as { images?: unknown }).images
    if (meta.twitter) delete (meta.twitter as { images?: unknown }).images
  }
  return meta
}

export default async function KnowledgeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pkg = await getPackageBySlug(slug)
  if (!pkg) notFound()

  const canonicalUrl = `${SITES.admin.baseUrl}/knowledge/${slug}`
  const consultMode = isConsultEligible(pkg)
  // 유료 결제는 기존 앱에 유지 — audience에 따라 핸드오프. 무료·상담문의는 허브에서 직접 접수.
  const applyUrl =
    pkg.targetAudience === 'owner'
      ? `${OWNER_URL}/services/${pkg.slug}`
      : `${EXPERT_URL}/education/${pkg.slug}`

  return (
    <div className="flex flex-1 flex-col">
      {/* 구조화 데이터 — Service(+Offer)·Breadcrumb: AEO/리치결과에서 카탈로그 항목을 인용 가능하게 */}
      <JsonLd
        data={[
          serviceJsonLd({
            name: pkg.name,
            description: pkg.valueDesc || pkg.description.slice(0, 160),
            url: canonicalUrl,
            category: CATEGORY_LABELS[pkg.category],
            price: pkg.price,
            isFree: pkg.isFree,
            image: pkg.bannerUrl,
          }),
          breadcrumbJsonLd('admin', [
            { name: '지식서비스', path: '/knowledge' },
            { name: pkg.name, path: `/knowledge/${slug}` },
          ]),
        ]}
      />
      <PageHero container="marketing" title={pkg.name} subtitle={pkg.provider} />
      <div className="container-read px-4 md:px-6 py-6 md:py-8">
        <Link href="/knowledge" className="mb-4 inline-block text-sm text-text-muted hover:text-text">
          &larr; 지식서비스 둘러보기
        </Link>

        <ServiceBanner src={pkg.bannerUrl} className="mb-5" sizes="(max-width: 768px) 100vw, 640px" />

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {pkg.isOfficial && <Badge variant="primary">지사네 공식</Badge>}
          <span className="text-sm font-semibold text-primary">{formatPackagePrice(pkg)}</span>
          {isConsultPriced(pkg) && <FreeConsultNote variant="pill" />}
          {pkg.duration && <span className="text-xs text-text-subtle">· {pkg.duration}</span>}
        </div>

        <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">{pkg.description}</p>

        {pkg.deliverables.length > 0 && (
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-semibold text-text">산출물</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-text-muted">
              {pkg.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-1.5">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {consultMode ? (
          <div className="mt-6 rounded-xl border border-border-light bg-surface-warm p-4 md:p-5">
            <h2 className="mb-3 text-sm font-bold text-text">상담 문의하기</h2>
            <ConsultInquiryForm action={submitHubConsultInquiry} privacyUrl="/privacy" tone="primary" />
          </div>
        ) : (
          <a
            href={applyUrl}
            className="btn-press focus-ring mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
          >
            신청하러 가기 &rarr;
          </a>
        )}
      </div>
    </div>
  )
}
