import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import type { DealWorkflowRow } from '@jisane/shared/types'
import type {
  RequestWithClient,
  DealWithRelations,
  SettlementWithDeal,
  LedgerEntry,
  ServiceOrderItem,
  InquiryItem,
} from '@jisane/shared/query-types'
import { autoAssignOverdue } from '@/lib/admin/actions'
import { MatchingTab } from './matching-tab'
import { ProgressTab } from './progress-tab'
import { SettlementTab } from './settlement-tab'
import { ServiceTab } from './service-tab'
import { InquiryTab } from './inquiry-tab'
import { DashboardTabs } from './dashboard-tabs'
import { SummaryCard } from './summary-card'

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // 24시간 초과 자동배정 체크
  await autoAssignOverdue()

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
      .select('id, title, detail, req_type, budget_hope, created_at, client:client!inner(company, ceo_name, email, contact)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .returns<RequestWithClient[]>(),
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
      request:request!inner(id, title, req_type, client:client!inner(company, ceo_name, email, contact)),
      partner:partner!inner(id, name, field, email, contact)
    `)
    .eq('status', 'working')
    .order('created_at', { ascending: false })
    .returns<DealWithRelations[]>()

  // workflow + 메시지 카운트 조회
  const dealIds = (workingDeals || []).map((d) => d.id)
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
        request:request!inner(id, title, client:client!inner(company, ceo_name, email, contact)),
        partner:partner!inner(id, name)
      )
    `)
    .in('escrow_status', ['deposited', 'reviewing'])
    .order('created_at', { ascending: false })
    .returns<SettlementWithDeal[]>()

  // 적립금 원장
  const { data: ledgerEntries } = await adminClient
    .from('guarantee_fund_ledger')
    .select('id, settlement_id, entry_type, amount, note, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
    .returns<LedgerEntry[]>()

  // 서비스 주문
  const { data: serviceOrders } = await adminClient
    .from('service_order')
    .select('*, client:client(company, ceo_name, email, contact), partner:partner(name, email, contact)')
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<ServiceOrderItem[]>()

  // 문의 목록
  const { data: rawInquiries } = await adminClient
    .from('inquiry')
    .select('id, author_id, author_type, category, content, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  // 문의 작성자 이메일 lookup
  const authorIds = (rawInquiries || []).map((i) => i.author_id).filter(Boolean) as string[]
  let authorEmailMap: Record<string, string> = {}
  if (authorIds.length > 0) {
    const [{ data: clients }, { data: partners }] = await Promise.all([
      adminClient.from('client').select('auth_user_id, email').in('auth_user_id', authorIds),
      adminClient.from('partner').select('auth_user_id, email').in('auth_user_id', authorIds),
    ])
    for (const c of clients || []) authorEmailMap[c.auth_user_id] = c.email
    for (const p of partners || []) authorEmailMap[p.auth_user_id] = p.email
  }
  const inquiries: InquiryItem[] = (rawInquiries || []).map((i) => ({
    ...i,
    author_email: i.author_id ? authorEmailMap[i.author_id] || null : null,
  }))

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
            deals={workingDeals || []}
            workflows={workflowData}
            messageCounts={messageCounts}
          />
        }
        settlementTab={
          <SettlementTab
            settlements={pendingSettlements || []}
            ledgerEntries={ledgerEntries || []}
            fundBalance={summary.guaranteeFundBalance}
          />
        }
        serviceTab={
          <ServiceTab orders={serviceOrders || []} />
        }
        inquiryTab={
          <InquiryTab inquiries={inquiries || []} />
        }
      />
    </div>
  )
}
