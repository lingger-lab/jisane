import Link from 'next/link'
import { getPackageBySlug } from '@jisane/shared/service-package/queries'
import { EducationDetailView } from './education-detail-view'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function EducationDetailPage(props: PageProps) {
  const { slug } = await props.params
  const pkg = await getPackageBySlug(slug)

  if (!pkg || pkg.targetAudience !== 'expert') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-text-muted">존재하지 않는 교육 과정입니다.</p>
        <Link href="/education" className="mt-4 text-sm text-accent hover:underline">
          교육 목록으로
        </Link>
      </div>
    )
  }

  return <EducationDetailView pkg={pkg} />
}
