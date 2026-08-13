import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { OrdersList } from './orders-list'

export const metadata = { title: '신청 확인 | 지사네 전문가회원' }

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
      <h1 className="mb-1 text-lg font-serif font-bold text-text">신청 확인</h1>
      <p className="mb-5 text-sm text-text-muted">
        결제 확인·취소는 지사네 관리자가 처리하며, 전문가회원은 진행 중 건의 <strong className="text-text">완료 처리</strong>를 담당합니다.
      </p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border-light bg-card p-10 text-center">
          <p className="text-sm text-text-muted">아직 신청이 없습니다.</p>
          <p className="mt-1 text-xs text-text-subtle">서비스가 공개되면 기업회원·시니어지식인회원의 신청이 여기에 표시됩니다.</p>
        </div>
      ) : (
        <OrdersList
          items={items.map((o) => {
            const ownerInfo = o.owner as unknown as { company: string | null; ceo_name: string | null } | null
            const expertInfo = o.expert as unknown as { name: string | null } | null
            return {
              id: o.id,
              packageName: o.package_name,
              orderer: ownerInfo
                ? (ownerInfo.company || ownerInfo.ceo_name || '기업')
                : (expertInfo?.name || '시니어지식인'),
              price: o.price,
              isFree: o.is_free,
              status: o.status,
              detail: o.detail,
              createdAt: o.created_at,
            }
          })}
        />
      )}
    </div>
  )
}
