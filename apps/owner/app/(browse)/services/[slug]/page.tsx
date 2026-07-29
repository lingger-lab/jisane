import Link from 'next/link'
import { getPackageBySlug } from '@jisane/shared/service-package/queries'
import { ServiceDetailView } from './service-detail-view'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ServiceDetailPage(props: PageProps) {
  const { slug } = await props.params
  const pkg = await getPackageBySlug(slug)

  if (!pkg || pkg.targetAudience !== 'owner') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-text-muted">존재하지 않는 서비스입니다.</p>
        <Link href="/services" className="mt-4 text-sm text-primary hover:underline">
          서비스 목록으로
        </Link>
      </div>
    )
  }

  return <ServiceDetailView pkg={pkg} />
}
