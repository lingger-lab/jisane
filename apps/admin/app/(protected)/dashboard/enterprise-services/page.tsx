import { redirect } from 'next/navigation'
import Link from 'next/link'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import type { EnterprisePillar } from '@jisane/shared/service-catalog'
import { EnterpriseServicesList } from './enterprise-services-list'
import { SyncSkillsButton } from './sync-skills-button'

export const metadata = { title: '기업 전문서비스 관리 | 지사네 관리자' }

const ENTERLABS_ID = 'd0000001-0000-0000-0000-000000000001'

export default async function EnterpriseServicesPage() {
  // page-레벨 admin 게이트 재확인 (layout은 soft nav에서 재실행되지 않는 신뢰경계가 아님)
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const { data } = await adminClient
    .from('service_package')
    .select('id, name, price, is_free, status, pillar, sort_order, visible, source_ref')
    .eq('provider_id', ENTERLABS_ID)
    .eq('target_audience', 'owner')
    .order('sort_order', { ascending: true })

  const items = (data ?? []) as {
    id: string
    name: string
    price: number
    is_free: boolean
    status: string
    pillar: EnterprisePillar | null
    visible: boolean
    source_ref: string | null
  }[]

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 animate-fade-in">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-serif font-bold text-text">기업 전문서비스 관리</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            기업회원 화면 &ldquo;5대 지원&rdquo;에 노출되는 서비스를 직접 등록·수정·보관합니다.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SyncSkillsButton />
          <Link
            href="/dashboard/enterprise-services/new"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
          >
            + 서비스 등록
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border-light bg-card p-10 text-center">
          <p className="text-sm text-text-muted">등록된 서비스가 없습니다.</p>
          <Link href="/dashboard/enterprise-services/new" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            첫 서비스를 등록해보세요 &rarr;
          </Link>
        </div>
      ) : (
        <EnterpriseServicesList items={items} />
      )}
    </div>
  )
}
