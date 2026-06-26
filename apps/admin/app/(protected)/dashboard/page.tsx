import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import type { DealWorkflowRow } from '@jisane/shared/types'
import { MatchingTab } from './matching-tab'
import { ProgressTab } from './progress-tab'
import { SettlementTab } from './settlement-tab'
import { ServiceTab } from './service-tab'
import { InquiryTab } from './inquiry-tab'
import { DashboardTabs } from './dashboard-tabs'

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // 요약 카운트
  const [requestsRes, dealsRes, settlementsRes, accrueRes, payoutRes, inquiryRes, serviceOrdersRes] = await Promise.all([
    adminClient.from('request').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    adminClient.from('deal').select('id', { count: 'exact', head: true }).eq('status', 'working'),
    adminClient.from('settlement').select('id', { count: 'exact', head: true }).in('escrow_status', ['deposited', 'reviewing']),
    adminClient.from('guarantee_fund_ledger').select('amount').eq('entry_type', 'accrue'),
    adminClient.from('guarantee_fund_ledger').select('amount').eq('entry_type', 'payout'),
    adminClient.from('inquiry').select('id', { count: 'exact', head: true }).in('status', ['open', 'human_routed']),
    adminClient.from('service_order').select('id', { count: 'exact', head: true }).in('status', ['pending', 'paid', 'processing']),
  ])

  const accrueTotal = (accrueRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
  const payoutTotal = (payoutRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0)

  const summary = {
    matchingWaiting: requestsRes.count || 0,
    inProgress: dealsRes.count || 0,
    settlementReady: settlementsRes.count || 0,
    guaranteeFundBalance: accrueTotal - payoutTotal,
    inquiryOpen: inquiryRes.count || 0,
    serviceOrders: serviceOrdersRes.count || 0,
  }

  // 매칭 대기 의뢰
  const [{ data: openRequests }, { data: interestsData }] = await Promise.all([
    adminClient
      .from('request')
      .select('id, title, detail, req_type, budget_hope, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false }),
    adminClient
      .from('partner_interest')
      .select('request_id, partner_id, note, created_at, partner:partner!inner(id, name, field)')
      .order('created_at', { ascending: false }),
  ])

  // 의뢰별 관심 표현 카운트
  const interestsByRequest = new Map<string, number>()
  for (const interest of (interestsData || []) as Array<{ request_id: string }>) {
    interestsByRequest.set(
      interest.request_id,
      (interestsByRequest.get(interest.request_id) || 0) + 1
    )
  }
  const interestCounts = Object.fromEntries(interestsByRequest)

  // 진행 중 거래
  const { data: workingDeals } = await adminClient
    .from('deal')
    .select(`
      id, work_fee, match_fee, total_pay, status, due_date, created_at,
      request:request!inner(id, title, req_type),
      partner:partner!inner(id, name, field)
    `)
    .eq('status', 'working')
    .order('created_at', { ascending: false })

  // workflow + 메시지 카운트 조회
  const dealIds = (workingDeals || []).map((d: Record<string, unknown>) => d.id as string)
  let workflowData: DealWorkflowRow[] = []
  let messageCounts: Record<string, number> = {}
  if (dealIds.length > 0) {
    const [{ data: wf }, { data: msgData }] = await Promise.all([
      adminClient
        .from('deal_workflow')
        .select('*')
        .in('deal_id', dealIds)
        .order('created_at', { ascending: true }),
      adminClient
        .from('deal_message')
        .select('deal_id')
        .in('deal_id', dealIds),
    ])
    workflowData = (wf || []) as DealWorkflowRow[]
    for (const msg of (msgData || []) as Array<{ deal_id: string }>) {
      messageCounts[msg.deal_id] = (messageCounts[msg.deal_id] || 0) + 1
    }
  }

  // 정산 대기
  const { data: pendingSettlements } = await adminClient
    .from('settlement')
    .select(`
      id, deal_id, escrow_status, guarantee_fee, deposited_at, created_at,
      deal:deal!inner(
        id, work_fee, match_fee, total_pay, status,
        request:request!inner(id, title),
        partner:partner!inner(id, name)
      )
    `)
    .in('escrow_status', ['deposited', 'reviewing'])
    .order('created_at', { ascending: false })

  // 적립금 원장
  const { data: ledgerEntries } = await adminClient
    .from('guarantee_fund_ledger')
    .select('id, settlement_id, entry_type, amount, note, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  // 서비스 주문
  const { data: serviceOrders } = await adminClient
    .from('service_order')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // 문의 목록
  const { data: inquiries } = await adminClient
    .from('inquiry')
    .select('id, author_type, category, content, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <h1 className="mb-6 text-xl font-bold text-text">대시보드</h1>

      {/* 요약 카드 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="매칭 대기" value={summary.matchingWaiting} unit="건" color="text-info" />
        <SummaryCard label="진행 중" value={summary.inProgress} unit="건" color="text-warning" />
        <SummaryCard label="정산 대기" value={summary.settlementReady} unit="건" color="text-success" />
        <SummaryCard label="서비스 주문" value={summary.serviceOrders} unit="건" color="text-primary" />
        <SummaryCard label="문의" value={summary.inquiryOpen} unit="건" color="text-error" />
        <SummaryCard
          label="적립금 잔액"
          value={summary.guaranteeFundBalance.toLocaleString('ko-KR')}
          unit="원"
          color="text-accent"
        />
      </div>

      {/* 탭 영역 */}
      <DashboardTabs
        matchingTab={
          <MatchingTab requests={openRequests || []} interestCounts={interestCounts} />
        }
        progressTab={
          <ProgressTab
            deals={(workingDeals || []) as unknown as Array<{
              id: string
              work_fee: number
              match_fee: number
              total_pay: number
              status: string
              created_at: string
              request: { id: string; title: string; req_type: string | null }
              partner: { id: string; name: string | null; field: string | null }
            }>}
            workflows={workflowData}
            messageCounts={messageCounts}
          />
        }
        settlementTab={
          <SettlementTab
            settlements={(pendingSettlements || []) as unknown as Array<{
              id: string
              deal_id: string
              escrow_status: string
              guarantee_fee: number
              deposited_at: string | null
              deal: {
                id: string
                work_fee: number
                match_fee: number
                total_pay: number
                request: { id: string; title: string }
                partner: { id: string; name: string | null }
              }
            }>}
            ledgerEntries={(ledgerEntries || []) as unknown as Array<{
              id: string
              entry_type: string
              amount: number
              note: string | null
              created_at: string
            }>}
            fundBalance={summary.guaranteeFundBalance}
          />
        }
        serviceTab={
          <ServiceTab
            orders={(serviceOrders || []) as unknown as Array<{
              id: string
              category: string
              package_slug: string
              package_name: string
              price: number
              status: string
              detail: string | null
              created_at: string
              client_id: string | null
              partner_id: string | null
            }>}
          />
        }
        inquiryTab={
          <InquiryTab
            inquiries={(inquiries || []) as unknown as Array<{
              id: string
              author_type: string | null
              category: string | null
              content: string
              status: string
              created_at: string
            }>}
          />
        }
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number | string
  unit: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-border-light bg-surface p-4 text-center shadow-sm card-hover">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-1 text-xl sm:text-2xl font-bold ${color}`}>
        {value}
        <span className="text-sm font-normal text-text-muted">{unit}</span>
      </p>
    </div>
  )
}
