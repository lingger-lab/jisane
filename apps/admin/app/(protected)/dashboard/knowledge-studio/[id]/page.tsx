import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { ENTERLABS_ID } from '@jisane/shared/service-catalog'
import { StudioPackageForm, type StudioProviderOption } from '../studio-package-form'

export const metadata = { title: '지식서비스 수정 | 지사네 관리자' }

interface PkgRow {
  id: string
  provider_id: string
  name: string
  category: string
  target_audience: string
  description: string
  value_desc: string
  price: number
  is_free: boolean
  duration: string | null
  deliverables: string[]
  banner_url: string | null
  status: string
  pillar: string | null
  visible: boolean
}

export default async function EditStudioServicePage({ params }: { params: Promise<{ id: string }> }) {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const { id } = await params

  const { data } = await adminClient
    .from('service_package')
    .select('id, provider_id, name, category, target_audience, description, value_desc, price, is_free, duration, deliverables, banner_url, status, pillar, visible')
    .eq('id', id)
    .neq('provider_id', ENTERLABS_ID)
    .single()

  if (!data) notFound()
  const pkg = data as unknown as PkgRow

  const { data: provData } = await adminClient
    .from('provider')
    .select('id, name, kind, status')
    .neq('id', ENTERLABS_ID)
    .neq('status', 'withdrawn')
    .order('name', { ascending: true })
  const providers = (provData ?? []) as StudioProviderOption[]

  // price_tbd sentinel: price 0 && is_free false → 상담 문의
  const priceTbd = pkg.price === 0 && !pkg.is_free

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 animate-fade-in">
      <Link href="/dashboard/knowledge-studio" className="mb-4 inline-block text-sm text-text-muted hover:text-text">
        &larr; 지식서비스 스튜디오
      </Link>
      <h1 className="mb-5 text-lg font-serif font-bold text-text">지식서비스 수정</h1>
      <StudioPackageForm
        providers={providers}
        defaults={{
          packageId: pkg.id,
          providerId: pkg.provider_id,
          name: pkg.name,
          category: pkg.category,
          targetAudience: pkg.target_audience,
          description: pkg.description,
          valueDesc: pkg.value_desc,
          price: pkg.price,
          isFree: pkg.is_free,
          priceTbd,
          duration: pkg.duration ?? '',
          deliverables: pkg.deliverables,
          bannerUrl: pkg.banner_url,
          status: pkg.status,
          pillar: pkg.pillar,
          visible: pkg.visible,
        }}
      />
    </div>
  )
}
