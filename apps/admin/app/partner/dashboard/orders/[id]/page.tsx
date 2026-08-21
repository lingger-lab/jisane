import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { OrderMessageThread, type OrderMessage } from '@jisane/ui/order-message-thread'
import { ORDER_STATUS_LABELS } from '@jisane/shared/labels'
import { ORDER_STATUS_BADGE_CLASSES } from '@jisane/shared/status-badges'
import { formatPackagePrice } from '@jisane/shared/service-catalog'
import { CompleteOrderButton } from '../complete-order-button'
import { sendServiceOrderMessage } from '@/lib/partner/actions'

export const metadata = { title: '신청 상세 | 지사네 전문가회원' }

const STEPS = [
  { key: 'pending', label: '접수' },
  { key: 'paid', label: '결제' },
  { key: 'processing', label: '진행' },
  { key: 'completed', label: '완료' },
]

export default async function PartnerOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner')
  const provider = await getProviderByAuthUser(user.id)
  if (!provider) redirect('/partner/apply')

  const { data: order } = await adminClient
    .from('service_order')
    .select('id, package_name, price, is_free, status, detail, created_at, provider_id, owner:owner(company, ceo_name), expert:expert(name)')
    .eq('id', id)
    .single()
  if (!order || order.provider_id !== provider.id) notFound()

  const { data: messages } = await adminClient
    .from('service_order_message')
    .select('id, sender_type, content, created_at')
    .eq('service_order_id', id)
    .order('created_at', { ascending: true })

  const ownerInfo = order.owner as unknown as { company: string | null; ceo_name: string | null } | null
  const expertInfo = order.expert as unknown as { name: string | null } | null
  const orderer = ownerInfo ? (ownerInfo.company || ownerInfo.ceo_name || '기업회원') : (expertInfo?.name || '시니어지식인')

  const cancelled = order.status === 'cancelled'
  const activeIdx = STEPS.findIndex((s) => s.key === order.status)

  return (
    <div className="animate-fade-in">
      <Link href="/partner/dashboard/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors">
        &larr; 신청 목록
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-serif font-bold text-text">{order.package_name}</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            신청: {orderer} · {new Date(order.created_at).toLocaleDateString('ko-KR')} · {formatPackagePrice({ isFree: order.is_free, price: order.price })}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_BADGE_CLASSES[order.status] || ''}`}>
          {ORDER_STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {/* 진행 상태 */}
      <div className="mb-5 rounded-xl border border-border-light bg-card p-4">
        {cancelled ? (
          <p className="text-sm text-error">취소된 신청입니다.</p>
        ) : (
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${i <= activeIdx ? 'bg-partner text-white' : 'bg-surface text-text-subtle'}`}>
                    {i + 1}
                  </span>
                  <span className={`mt-1 text-xs ${i <= activeIdx ? 'text-text' : 'text-text-subtle'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className={`mb-4 h-px w-5 md:w-8 ${i < activeIdx ? 'bg-partner' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        )}
        {order.status === 'processing' && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <CompleteOrderButton orderId={order.id} />
          </div>
        )}
      </div>

      {order.detail && (
        <div className="mb-5 rounded-xl border border-border-light bg-surface-warm p-4 text-sm leading-relaxed text-text">
          <span className="text-text-subtle">요청사항: </span>
          {order.detail}
        </div>
      )}

      {/* 메시지 스레드 — 기업회원·매니저와 소통, 산출물 링크 전달 */}
      <OrderMessageThread
        orderId={id}
        selfType="provider"
        messages={(messages ?? []) as OrderMessage[]}
        sendAction={sendServiceOrderMessage}
      />
    </div>
  )
}
