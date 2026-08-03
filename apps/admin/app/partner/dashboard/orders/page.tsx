import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { ORDER_STATUS_LABELS_FALLBACK } from '../order-labels'
import { CompleteOrderButton } from './complete-order-button'

export const metadata = { title: '신청 확인 | 지사네 전문가회원' }

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-info-light text-info',
  paid: 'bg-warning-light text-warning',
  processing: 'bg-success-light text-success',
  completed: 'bg-surface text-text-muted',
  cancelled: 'bg-error-light text-error',
}

export default async function PartnerOrdersPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner')
  const provider = await getProviderByAuthUser(user.id)
  if (!provider) redirect('/partner/apply')

  const { data: orders } = await adminClient
    .from('service_order')
    .select('id, package_name, category, price, is_free, status, detail, created_at, owner:owner(company, ceo_name), expert:expert(name)')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const items = orders || []

  return (
    <div className="animate-fade-in">
      <h1 className="mb-1 text-lg font-bold text-text">신청 확인</h1>
      <p className="mb-5 text-sm text-text-muted">
        결제 확인·취소는 지사네 관리자가 처리하며, 전문가회원은 진행 중 건의 <strong className="text-text">완료 처리</strong>를 담당합니다.
      </p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border-light bg-white p-10 text-center">
          <p className="text-sm text-text-muted">아직 신청이 없습니다.</p>
          <p className="mt-1 text-xs text-text-subtle">서비스가 공개되면 기업회원·시니어지식인회원의 신청이 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((o) => {
            const ownerInfo = o.owner as unknown as { company: string | null; ceo_name: string | null } | null
            const expertInfo = o.expert as unknown as { name: string | null } | null
            const orderer = ownerInfo
              ? (ownerInfo.company || ownerInfo.ceo_name || '기업')
              : (expertInfo?.name || '시니어지식인')
            return (
              <div key={o.id} className="rounded-xl border border-border-light bg-white p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">{o.package_name}</p>
                    <p className="mt-0.5 text-xs text-text-subtle">
                      신청: {orderer} · {new Date(o.created_at).toLocaleDateString('ko-KR')} ·{' '}
                      {o.is_free ? '무료' : `${o.price.toLocaleString('ko-KR')}원`}
                    </p>
                    {o.detail && (
                      <p className="mt-2 rounded-lg bg-surface-warm p-2.5 text-xs text-text-muted">{o.detail}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[o.status] || ''}`}>
                      {ORDER_STATUS_LABELS_FALLBACK[o.status] || o.status}
                    </span>
                    {o.status === 'processing' && <CompleteOrderButton orderId={o.id} />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
