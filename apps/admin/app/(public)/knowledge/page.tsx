import Link from 'next/link'
import { getAllPublishedPackages } from '@jisane/shared/service-package/queries'
import { formatPackagePrice } from '@jisane/shared/service-catalog'
import { PageHero } from '@jisane/ui/page-hero'
import { ServiceBanner } from '@jisane/ui/service-banner'
import { Badge } from '@jisane/ui/badge'

export const metadata = {
  title: '지식서비스 | 지사네',
  description: '시니어지식인·전문가·지사네가 제공하는 지식서비스를 한곳에서 둘러보세요.',
}

export default async function KnowledgeHubPage() {
  const packages = await getAllPublishedPackages()

  return (
    <div className="flex flex-1 flex-col">
      <PageHero
        container="marketing"
        eyebrow="지식서비스"
        title="지사네 지식서비스"
        subtitle="시니어지식인·전문가·지사네가 제공하는 전문 서비스"
        size="lg"
      />
      <div className="container-marketing px-4 md:px-6 py-8 md:py-12">
        {packages.length === 0 ? (
          <div className="rounded-xl border border-border-light bg-card p-10 text-center">
            <p className="text-sm text-text-muted">아직 공개된 지식서비스가 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <Link
                key={pkg.slug}
                href={`/knowledge/${pkg.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border-light bg-card shadow-xs card-hover transition-colors hover:border-primary/30"
              >
                <ServiceBanner src={pkg.bannerUrl} sizes="(max-width: 640px) 100vw, 360px" />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2">
                    <h3 className="min-w-0 truncate font-semibold text-text">{pkg.name}</h3>
                    {pkg.isOfficial && <Badge variant="primary">지사네 공식</Badge>}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-text-subtle">{pkg.provider}</p>
                  <p className="mt-1 flex-1 text-sm text-text-muted leading-relaxed line-clamp-2">
                    {pkg.valueDesc || pkg.description}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-primary">{formatPackagePrice(pkg)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
