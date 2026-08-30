import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getPackageBySlug } from '@jisane/shared/service-package/queries'
import { isConsultEligible } from '@jisane/shared/service-catalog'
import { SITES } from '@jisane/shared/seo'
import { EducationDetailView } from './education-detail-view'

interface PageProps {
  params: Promise<{ slug: string }>
}

// 같은 카탈로그 항목이 허브 /knowledge 에도 있으므로 canonical을 허브로 집약(중복콘텐츠 방지).
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const pkg = await getPackageBySlug(slug)
  if (!pkg || pkg.targetAudience !== 'expert') return {}
  return {
    title: pkg.name,
    description: pkg.valueDesc || pkg.description.slice(0, 120),
    alternates: { canonical: `${SITES.admin.baseUrl}/knowledge/${slug}` },
  }
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

  // 상담문의 접수 폼 프리필 — 로그인 시 프로필(이름·연락처)로.
  let isLoggedIn = false
  let defaultName = ''
  let defaultPhone = ''
  if (isConsultEligible(pkg)) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
    if (user) {
      const { data: expert } = await adminClient
        .from('expert')
        .select('name, contact')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      defaultName = (expert?.name as string | undefined) ?? ''
      defaultPhone = (expert?.contact as string | undefined) ?? ''
    }
  }

  return (
    <EducationDetailView
      pkg={pkg}
      isLoggedIn={isLoggedIn}
      defaultName={defaultName}
      defaultPhone={defaultPhone}
    />
  )
}
