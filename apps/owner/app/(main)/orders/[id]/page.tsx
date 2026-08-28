import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { PageHero } from '@jisane/ui/page-hero'
import { StatusBadge } from '@jisane/ui/status-badge'
import { OrderMessageThread, type OrderMessage } from '@jisane/ui/order-message-thread'
import { formatPackagePrice } from '@jisane/shared/service-catalog'
import { sendServiceOrderMessage } from '@/lib/message/actions'

const STEPS = [
  { key: 'pending', label: '접수' },
  { key: 'paid', label: '결제' },
  { key: 'processing', label: '진행' },
  { key: 'completed', label: '완료' },
]

export default async function ServiceOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: owner } = await adminClient.from('owner').select('id').eq('auth_user_id', user.id).single()
  if (!owner) redirect('/')

  const { data: order } = await adminClient
    .from('service_order')
    .select('id, package_name, price, is_free, status, detail, created_at, owner_id, deliverable_url, deliverable_note, delivered_at')
    .eq('id', id)
    .single()
  if (!order || order.owner_id !== owner.id) notFound()

  const { data: messages } = await adminClient
    .from('service_order_message')
    .select('id, sender_type, content, created_at')
    .eq('service_order_id', id)
    .order('created_at', { ascending: true })

  const cancelled = order.status === 'cancelled'
  const activeIdx = STEPS.findIndex((s) => s.key === order.status)

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero
        eyebrow="전문서비스 주문"
        title={order.package_name}
        subtitle={formatPackagePrice({ isFree: order.is_free, price: order.price })}
        back={
          <Link href="/status" className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors">
            &larr; 현황
          </Link>
        }
      />

      <div className="container-app flex flex-col gap-5 px-4 md:px-6 py-6">
        {/* 진행 상태 */}
        <div className="rounded-xl border border-border-light p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-text">진행 상태</span>
            <StatusBadge kind="order" status={order.status} />
          </div>
          {cancelled ? (
            <p className="text-sm text-error">취소된 주문입니다.</p>
          ) : (
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${i <= activeIdx ? 'bg-primary text-white' : 'bg-surface text-text-subtle'}`}>
                      {i + 1}
                    </span>
                    <span className={`mt-1 text-xs ${i <= activeIdx ? 'text-text' : 'text-text-subtle'}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span className={`mb-4 h-px w-5 md:w-8 ${i < activeIdx ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 주문 정보 */}
        <div className="rounded-xl border border-border-light bg-surface-warm p-4 text-sm">
          <p className="text-text-muted tabular-nums">신청일 {new Date(order.created_at).toLocaleDateString('ko-KR')}</p>
          {order.detail && (
            <p className="mt-2 leading-relaxed text-text">
              <span className="text-text-subtle">요청사항: </span>
              {order.detail}
            </p>
          )}
        </div>

        {/* 산출물 — 공급자가 전달한 결과물 링크 */}
        {order.delivered_at && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="mb-1 text-sm font-semibold text-text">전달된 산출물</p>
            {order.deliverable_url && (
              <a
                href={order.deliverable_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm font-medium text-primary hover:underline"
              >
                {order.deliverable_url as string}
              </a>
            )}
            {order.deliverable_note && (
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-text-muted">{order.deliverable_note as string}</p>
            )}
          </div>
        )}

        {/* 메시지 스레드 — 전문가회원·매니저와 소통, 산출물 링크 전달 */}
        <OrderMessageThread
          orderId={id}
          selfType="owner"
          messages={(messages ?? []) as OrderMessage[]}
          sendAction={sendServiceOrderMessage}
        />
      </div>
    </div>
  )
}
