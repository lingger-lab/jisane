import { redirect } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { AuditConsole, type AuditRow } from './audit-console'

export const metadata = { title: '메시지 감사 | 지사네 관리자' }

const STATUS_FILTERS = ['unreviewed', 'suspicious', 'violation', 'normal', 'all'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

/** 감사 큐 조회 — message_audit(triage) → 채널별 원문 2단 fetch(폴리모픽 LEFT JOIN 등가). */
async function getAuditQueue(status: StatusFilter): Promise<AuditRow[]> {
  let q = adminClient
    .from('message_audit')
    .select('channel, message_id, status, flagged_reasons, auto_flagged, note, audited_by, audited_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (status !== 'all') q = q.eq('status', status)

  const { data: audits, error } = await q
  if (error) {
    console.error('[message-audit] queue fetch failed:', error.message)
    return []
  }
  const rows = (audits ?? []) as Omit<AuditRow, 'content' | 'sender_type' | 'message_created_at'>[]

  const dealIds = rows.filter((r) => r.channel === 'deal').map((r) => r.message_id)
  const orderIds = rows.filter((r) => r.channel === 'service_order').map((r) => r.message_id)

  const [dealMsgs, orderMsgs] = await Promise.all([
    dealIds.length
      ? adminClient.from('deal_message').select('id, content, sender_type, created_at').in('id', dealIds)
      : Promise.resolve({ data: [] as { id: string; content: string; sender_type: string; created_at: string }[] }),
    orderIds.length
      ? adminClient.from('service_order_message').select('id, content, sender_type, created_at').in('id', orderIds)
      : Promise.resolve({ data: [] as { id: string; content: string; sender_type: string; created_at: string }[] }),
  ])

  const contentById = new Map<string, { content: string; sender_type: string; created_at: string }>()
  for (const m of (dealMsgs.data ?? []) as { id: string; content: string; sender_type: string; created_at: string }[]) contentById.set(`deal:${m.id}`, m)
  for (const m of (orderMsgs.data ?? []) as { id: string; content: string; sender_type: string; created_at: string }[]) contentById.set(`service_order:${m.id}`, m)

  return rows.map((r) => {
    const msg = contentById.get(`${r.channel}:${r.message_id}`)
    return {
      ...r,
      content: msg?.content ?? '(원문을 찾을 수 없습니다)',
      sender_type: msg?.sender_type ?? '—',
      message_created_at: msg?.created_at ?? null,
    }
  })
}

export default async function MessageAuditPage(props: { searchParams: Promise<{ status?: string }> }) {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const { status: statusParam } = await props.searchParams
  const status: StatusFilter = STATUS_FILTERS.includes(statusParam as StatusFilter)
    ? (statusParam as StatusFilter)
    : 'unreviewed'

  const rows = await getAuditQueue(status)

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 animate-fade-in">
      <h1 className="mb-1 text-lg font-serif font-bold text-text">메시지 감사</h1>
      <p className="mb-5 text-sm text-text-muted">
        위험 패턴(전화·계좌·외부 메신저·직거래 유도)이 감지된 회원 메시지를 검토하고 판정합니다. 회원에게는 노출되지 않습니다.
      </p>
      <AuditConsole rows={rows} activeStatus={status} />
    </div>
  )
}
