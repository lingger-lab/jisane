import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getPackageBySlug } from '@jisane/shared/service-package/queries'
import { isConsultEligible } from '@jisane/shared/service-catalog'
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

  // 상담문의 접수 폼 프리필 — 로그인 시 프로필(대표자명·연락처)로. 유료 결제 서비스엔 불필요.
  let isLoggedIn = false
  let defaultName = ''
  let defaultPhone = ''
  if (isConsultEligible(pkg)) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
    if (user) {
      const { data: owner } = await adminClient
        .from('owner')
        .select('ceo_name, contact')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      defaultName = (owner?.ceo_name as string | undefined) ?? ''
      defaultPhone = (owner?.contact as string | undefined) ?? ''
    }
  }

  return (
    <ServiceDetailView
      pkg={pkg}
      isLoggedIn={isLoggedIn}
      defaultName={defaultName}
      defaultPhone={defaultPhone}
    />
  )
}
