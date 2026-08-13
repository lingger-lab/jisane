import { redirect, notFound } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { EnterprisePackageForm } from '../enterprise-package-form'

export const metadata = { title: '기업 전문서비스 수정 | 지사네 관리자' }

const ENTERLABS_ID = 'd0000001-0000-0000-0000-000000000001'

export default async function EditEnterpriseServicePage(props: {
  params: Promise<{ id: string }>
}) {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const { id } = await props.params

  const { data: pkg } = await adminClient
    .from('service_package')
    .select('id, name, pillar, description, value_desc, price, is_free, duration, deliverables, status')
    .eq('id', id)
    .eq('provider_id', ENTERLABS_ID)
    .single()

  if (!pkg) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 animate-fade-in">
      <h1 className="mb-1 text-lg font-serif font-bold text-text">기업 전문서비스 수정</h1>
      <p className="mb-5 text-sm text-text-muted">URL 주소(slug)는 변경할 수 없습니다.</p>
      <EnterprisePackageForm
        defaults={{
          packageId: pkg.id,
          name: pkg.name,
          pillar: pkg.pillar ?? '',
          description: pkg.description,
          valueDesc: pkg.value_desc,
          price: pkg.price,
          isFree: pkg.is_free,
          priceTbd: !pkg.is_free && pkg.price === 0,
          duration: pkg.duration ?? '',
          deliverables: pkg.deliverables,
          status: pkg.status,
        }}
      />
    </div>
  )
}
