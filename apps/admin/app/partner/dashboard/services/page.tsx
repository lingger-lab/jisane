import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { ServicesList } from './services-list'

export const metadata = { title: '서비스 관리 | 지사네 전문가회원' }

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
        <ServicesList items={items} />
      )}
    </div>
  )
}
