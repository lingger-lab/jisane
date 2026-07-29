import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { PACKAGE_STATUS_LABELS } from '@jisane/shared/labels'
import { SuccessToast } from '@jisane/ui/toast'
import { ArchiveButton } from './archive-button'

export const metadata = { title: '서비스 관리 | 지사네 파트너공간' }

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-warning-light text-warning',
  published: 'bg-success-light text-success',
  archived: 'bg-surface text-text-subtle',
}

export default async function PartnerServicesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner')
  const provider = await getProviderByAuthUser(user.id)
  if (!provider) redirect('/partner/apply')

  const { data: packages } = await adminClient
    .from('service_package')
    .select('id, slug, name, category, price, is_free, status, target_audience, created_at')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false })

  const items = packages || []

  return (
    <div className="animate-fade-in">
      <Suspense><SuccessToast /></Suspense>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text">서비스 관리</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            등록한 서비스는 관리자 검수 후 공개됩니다.
          </p>
        </div>
        <Link
          href="/partner/dashboard/services/new"
          className="rounded-xl bg-info px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-info/90"
        >
          + 서비스 등록
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border-light bg-white p-10 text-center">
          <p className="text-sm text-text-muted">등록된 서비스가 없습니다.</p>
          <Link href="/partner/dashboard/services/new" className="mt-3 inline-block text-sm font-medium text-info hover:underline">
            첫 서비스를 등록해보세요 &rarr;
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((pkg) => (
            <div key={pkg.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-light bg-white p-4 shadow-xs">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-text">{pkg.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[pkg.status] || ''}`}>
                    {PACKAGE_STATUS_LABELS[pkg.status] || pkg.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-text-subtle">
                  {pkg.target_audience === 'owner' ? '기업 대상' : '전문가 대상'} ·{' '}
                  {pkg.is_free ? '무료' : `${pkg.price.toLocaleString('ko-KR')}원`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/partner/dashboard/services/${pkg.id}`}
                  className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-info/30 hover:text-info"
                >
                  수정
                </Link>
                {pkg.status !== 'archived' && <ArchiveButton packageId={pkg.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
