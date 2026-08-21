import { notFound } from 'next/navigation'
import Link from 'next/link'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { OrderMessageThread, type OrderMessage } from '@jisane/ui/order-message-thread'
import { ORDER_STATUS_LABELS } from '@jisane/shared/labels'
import { ORDER_STATUS_BADGE_CLASSES } from '@jisane/shared/status-badges'
import { formatPackagePrice } from '@jisane/shared/service-catalog'
import { sendServiceOrderMessage } from '@/lib/admin/message-actions'

export const metadata = { title: '주문 대화 | 지사네 관리자' }

export default async function AdminServiceOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  await verifyAdmin()
  const { id } = await props.params

  const { data: order } = await adminClient
    .from('service_order')
    .select('id, package_name, price, is_free, status, detail, created_at, owner:owner(company, ceo_name), expert:expert(name), provider:provider(name)')
    .eq('id', id)
    .single()
  if (!order) notFound()

  const { data: messages } = await adminClient
    .from('service_order_message')
    .select('id, sender_type, content, created_at')
    .eq('service_order_id', id)
    .order('created_at', { ascending: true })

  const ownerInfo = order.owner as unknown as { company: string | null; ceo_name: string | null } | null
  const expertInfo = order.expert as unknown as { name: string | null } | null
  const providerInfo = order.provider as unknown as { name: string | null } | null
  const orderer = ownerInfo ? (ownerInfo.company || ownerInfo.ceo_name || '기업회원') : (expertInfo?.name || '시니어지식인')

  return (
    <div className="mx-auto max-w-2xl animate-fade-in px-4 py-6">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors">
        &larr; 대시보드
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-serif font-bold text-text">{order.package_name}</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            신청: {orderer}
            {providerInfo?.name && <> · 제공: {providerInfo.name}</>}
            {' · '}{new Date(order.created_at).toLocaleDateString('ko-KR')}
            {' · '}{formatPackagePrice({ isFree: order.is_free, price: order.price })}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_BADGE_CLASSES[order.status] || ''}`}>
          {ORDER_STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      {order.detail && (
        <div className="mb-5 rounded-xl border border-border-light bg-surface-warm p-4 text-sm leading-relaxed text-text">
          <span className="text-text-subtle">요청사항: </span>
          {order.detail}
        </div>
      )}

      {/* 3자 대화 — 매니저가 기업회원·전문가회원과 소통 */}
      <OrderMessageThread
        orderId={id}
        selfType="admin"
        messages={(messages ?? []) as OrderMessage[]}
        sendAction={sendServiceOrderMessage}
      />
    </div>
  )
}
