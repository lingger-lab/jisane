import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { PACKAGE_STATUS_LABELS } from '@jisane/shared/labels'
import { PackageForm } from '../package-form'

export const metadata = { title: '서비스 수정 | 지사네 전문가회원' }

export default async function EditServicePackagePage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner')
  const provider = await getProviderByAuthUser(user.id)
  if (!provider) redirect('/partner/apply')

  // 소유권 필터 포함 조회 — 타 전문가회원 패키지는 404
  const { data: pkg } = await adminClient
    .from('service_package')
    .select('id, name, category, target_audience, description, value_desc, price, is_free, duration, deliverables, status')
    .eq('id', id)
    .eq('provider_id', provider.id)
    .single()

  if (!pkg) notFound()

  return (
    <div className="animate-fade-in">
      <h1 className="mb-1 text-lg font-bold text-text">서비스 수정</h1>
      <p className="mb-5 text-sm text-text-muted">
        상태: {PACKAGE_STATUS_LABELS[pkg.status] || pkg.status} — 카테고리·대상은 등록 후 변경할 수 없습니다.
        {pkg.status === 'published' &&
          ` 공개 중인 서비스는 수정 저장 시 '${PACKAGE_STATUS_LABELS.draft}' 상태로 전환되며, 관리자 재검수 후 다시 공개됩니다.`}
      </p>
      <PackageForm
        defaults={{
          packageId: pkg.id,
          name: pkg.name,
          category: pkg.category,
          targetAudience: pkg.target_audience,
          description: pkg.description,
          valueDesc: pkg.value_desc,
          price: pkg.price,
          isFree: pkg.is_free,
          duration: pkg.duration ?? '',
          deliverables: pkg.deliverables,
        }}
      />
    </div>
  )
}
