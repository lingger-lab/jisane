import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { ORDER_STATUS_LABELS_FALLBACK } from './order-labels'

export const metadata = { title: '파트너 대시보드 | 지사네' }

export default async function PartnerDashboardHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner')
  const provider = await getProviderByAuthUser(user.id)
  if (!provider) redirect('/partner/apply')

  const [pkgRes, pendingOrderRes, recentOrdersRes] = await Promise.all([
    adminClient
      .from('service_package')
      .select('id, status')
      .eq('provider_id', provider.id),
    adminClient
      .from('service_order')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', provider.id)
      .eq('status', 'pending'),
    adminClient
      .from('service_order')
      .select('id, package_name, status, price, is_free, created_at')
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const packages = pkgRes.data || []
  const publishedCount = packages.filter((p) => p.status === 'published').length
  const draftCount = packages.filter((p) => p.status === 'draft').length
  const newOrderCount = pendingOrderRes.count || 0
  const recentOrders = recentOrdersRes.data || []

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/partner/dashboard/orders" className="rounded-xl border border-border-light bg-white p-4 text-center shadow-xs transition-colors hover:border-info/30">
          <p className="text-2xl font-bold text-info">{newOrderCount}</p>
          <p className="mt-1 text-xs text-text-muted">신규 신청</p>
        </Link>
        <Link href="/partner/dashboard/services" className="rounded-xl border border-border-light bg-white p-4 text-center shadow-xs transition-colors hover:border-info/30">
          <p className="text-2xl font-bold text-text">{publishedCount}</p>
          <p className="mt-1 text-xs text-text-muted">공개 서비스</p>
        </Link>
        <Link href="/partner/dashboard/services" className="rounded-xl border border-border-light bg-white p-4 text-center shadow-xs transition-colors hover:border-info/30">
          <p className="text-2xl font-bold text-text-muted">{draftCount}</p>
          <p className="mt-1 text-xs text-text-muted">검수 대기</p>
        </Link>
      </div>

      {/* 최근 신청 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-text">최근 신청</h2>
          <Link href="/partner/dashboard/orders" className="text-xs text-info hover:underline">전체 보기</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="rounded-xl border border-border-light bg-white p-8 text-center">
            <p className="text-sm text-text-muted">아직 신청이 없습니다.</p>
            <p className="mt-1 text-xs text-text-subtle">서비스가 공개되면 신청이 이곳에 표시됩니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-border-light bg-white p-3">
                <div>
                  <p className="text-sm font-medium text-text">{o.package_name}</p>
                  <p className="text-xs text-text-subtle">
                    {new Date(o.created_at).toLocaleDateString('ko-KR')} ·{' '}
                    {o.is_free ? '무료' : `${o.price.toLocaleString('ko-KR')}원`}
                  </p>
                </div>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">
                  {ORDER_STATUS_LABELS_FALLBACK[o.status] || o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
