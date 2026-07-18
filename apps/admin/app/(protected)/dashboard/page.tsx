import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import type { DealWorkflowRow } from '@jisane/shared/types'
import type {
  RequestWithOwner,
  DealWithRelations,
  SettlementWithDeal,
  LedgerEntry,
  ServiceOrderItem,
  InquiryItem,
  ProposedMatchingItem,
  InvitationAdminItem,
  DisputeItem,
} from '@jisane/shared/query-types'
import { autoAssignOverdue, runAutoRelease } from '@/lib/admin/actions'
import { MatchingTab } from './matching-tab'
import { ProposedTab } from './proposed-tab'
import { ProgressTab } from './progress-tab'
import { InvitationTab } from './invitation-tab'
import { SettlementTab } from './settlement-tab'
import { ServiceTab } from './service-tab'
import { DisputeTab } from './dispute-tab'
import { InquiryTab } from './inquiry-tab'
import { DashboardTabs } from './dashboard-tabs'
import { SummaryCard } from './summary-card'

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // 자동화: 24시간 초과 자동배정 + 정산 자동 release (병렬 실행)
  const [assignResult, releaseResult] = await Promise.allSettled([autoAssignOverdue(), runAutoRelease()])
  if (assignResult.status === 'rejected') {
    console.error('[dashboard] autoAssignOverdue failed:', assignResult.reason)
  }
  if (releaseResult.status === 'rejected') {
    console.error('[dashboard] runAutoRelease failed:', releaseResult.reason)
  }

  // 요약 카운트
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [requestsRes, proposedRes, dealsRes, settlementsRes, accrueRes, payoutRes, inquiryRes, serviceOrdersRes, invitationRes, disputeRes, overdueSettlementRes, auditPendingRes] = await Promise.all([
    adminClient.from('request').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    adminClient.from('matching').select('id', { count: 'exact', head: true }).eq('status', 'proposed'),
    adminClient.from('deal').select('id', { count: 'exact', head: true }).eq('status', 'working'),
    adminClient.from('settlement').select('id', { count: 'exact', head: true }).in('escrow_status', ['deposited', 'reviewing']),
    adminClient.from('guarantee_fund_ledger').select('amount').eq('entry_type', 'accrue'),
    adminClient.from('guarantee_fund_ledger').select('amount').eq('entry_type', 'payout'),
    adminClient.from('inquiry').select('id', { count: 'exact', head: true }).in('status', ['open', 'human_routed']),
    adminClient.from('service_order').select('id', { count: 'exact', head: true }).in('status', ['pending', 'paid', 'processing']),
    adminClient.from('invitation').select('id', { count: 'exact', head: true }).eq('status', 'invited'),
    adminClient.from('dispute').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    // 긴급도: 7일 초과 reviewing 정산
    adminClient.from('settlement').select('id', { count: 'exact', head: true }).eq('escrow_status', 'reviewing').lt('updated_at', sevenDaysAgo),
    // 검토대기: 감사 대상 항목
    adminClient.from('settlement').select('id', { count: 'exact', head: true }).eq('audit_sampled', true).in('escrow_status', ['deposited', 'reviewing']),
  ])

  const accrueTotal = (accrueRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
  const payoutTotal = (payoutRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0)

  const summary = {
    matchingWaiting: requestsRes.count || 0,
    proposed: proposedRes.count || 0,
    inProgress: dealsRes.count || 0,
    invitationPending: invitationRes.count || 0,
    settlementReady: settlementsRes.count || 0,
    guaranteeFundBalance: accrueTotal - payoutTotal,
    inquiryOpen: inquiryRes.count || 0,
    serviceOrders: serviceOrdersRes.count || 0,
    disputeOpen: disputeRes.count || 0,
  }

  // 긴급도 카운터
  const urgentCount = (disputeRes.count || 0) + (overdueSettlementRes.count || 0)
  const auditCount = auditPendingRes.count || 0

  // 탭 데이터 — 독립 쿼리 병렬 실행
  const [
    proposedMatchingsRes,
    openRequestsRes,
    interestsDataRes,
    workingDealsRes,
    pendingSettlementsRes,
    ledgerEntriesRes,
    serviceOrdersRes2,
    allInvitationsRes,
    allDisputesRes,
    rawInquiriesRes,
  ] = await Promise.all([
    adminClient
      .from('matching')
      .select(`
        id, status, created_at,
        request:request!inner(id, title, req_type, budget_hope, owner:owner!inner(company, ceo_name, email, contact)),
        expert:expert!inner(id, name, field, email, contact)
      `)
      .eq('status', 'proposed')
      .order('created_at', { ascending: false })
      .returns<ProposedMatchingItem[]>(),
    adminClient
      .from('request')
      .select('id, title, detail, req_type, budget_hope, created_at, owner:owner!inner(company, ceo_name, email, contact)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .returns<RequestWithOwner[]>(),
    adminClient
      .from('expert_interest')
      .select('request_id, expert_id, note, created_at, expert:expert!inner(id, name, field)')
      .order('created_at', { ascending: false }),
    adminClient
      .from('deal')
      .select(`
        id, work_fee, match_fee, total_pay, status, due_date, created_at,
        request:request!inner(id, title, req_type, owner:owner!inner(company, ceo_name, email, contact)),
        expert:expert!inner(id, name, field, email, contact)
      `)
      .eq('status', 'working')
      .order('created_at', { ascending: false })
      .returns<DealWithRelations[]>(),
    adminClient
      .from('settlement')
      .select(`
        id, deal_id, escrow_status, guarantee_fee, deposited_at, created_at,
        auto_processed, queue_status, audit_sampled,
        deal:deal!inner(
          id, work_fee, match_fee, total_pay, status,
          request:request!inner(id, title, owner:owner!inner(company, ceo_name, email, contact)),
          expert:expert!inner(id, name)
        )
      `)
      .in('escrow_status', ['deposited', 'reviewing'])
      .order('created_at', { ascending: false })
      .returns<SettlementWithDeal[]>(),
    adminClient
      .from('guarantee_fund_ledger')
      .select('id, settlement_id, entry_type, amount, note, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<LedgerEntry[]>(),
    adminClient
      .from('service_order')
      .select('id, category, package_slug, package_name, price, status, detail, created_at, owner_id, expert_id, provider_id, is_free, owner:owner(company, ceo_name, email, contact), expert:expert(name, email, contact), provider:provider(name, type)')
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<ServiceOrderItem[]>(),
    adminClient
      .from('invitation')
      .select(`
        id, status, est_hours, est_amount, cap_amount, created_at,
        owner:owner!inner(id, company, ceo_name, email),
        expert:expert!inner(id, name, field),
        request:request(id, title)
      `)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<InvitationAdminItem[]>(),
    adminClient
      .from('dispute')
      .select('id, target_type, target_id, raised_by, reason, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<DisputeItem[]>(),
    adminClient
      .from('inquiry')
      .select('id, author_id, author_type, category, content, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const proposedMatchings = proposedMatchingsRes.data
  const openRequests = openRequestsRes.data
  const workingDeals = workingDealsRes.data
  const pendingSettlements = pendingSettlementsRes.data
  const ledgerEntries = ledgerEntriesRes.data
  const serviceOrders = serviceOrdersRes2.data
  const allInvitations = allInvitationsRes.data
  const allDisputes = allDisputesRes.data
  const rawInquiries = rawInquiriesRes.data

  // 의뢰별 관심 표현 카운트
  const interestsByRequest = new Map<string, number>()
  for (const interest of (interestsDataRes.data || []) as Array<{ request_id: string }>) {
    interestsByRequest.set(
      interest.request_id,
      (interestsByRequest.get(interest.request_id) || 0) + 1
    )
  }
  const interestCounts = Object.fromEntries(interestsByRequest)

  // 종속 쿼리: workflow + 메시지 (dealIds 필요) + 문의 이메일 lookup (authorIds 필요)
  const dealIds = (workingDeals || []).map((d) => d.id)
  const authorIds = (rawInquiries || []).map((i) => i.author_id).filter(Boolean) as string[]

  let workflowData: DealWorkflowRow[] = []
  let messageCounts: Record<string, number> = {}
  let authorEmailMap: Record<string, string> = {}

  // 종속 쿼리 병렬 실행
  const secondaryPromises: Promise<void>[] = []

  if (dealIds.length > 0) {
    secondaryPromises.push(
      Promise.all([
        adminClient
          .from('deal_workflow')
          .select('id, deal_id, step, status, note, created_at, updated_at')
          .in('deal_id', dealIds)
          .order('created_at', { ascending: true }),
        adminClient
          .from('deal_message')
          .select('deal_id')
          .in('deal_id', dealIds),
      ]).then(([wfRes, msgRes]) => {
        workflowData = (wfRes.data || []) as DealWorkflowRow[]
        for (const msg of (msgRes.data || []) as Array<{ deal_id: string }>) {
          messageCounts[msg.deal_id] = (messageCounts[msg.deal_id] || 0) + 1
        }
      })
    )
  }

  if (authorIds.length > 0) {
    secondaryPromises.push(
      Promise.all([
        adminClient.from('owner').select('auth_user_id, email').in('auth_user_id', authorIds),
        adminClient.from('expert').select('auth_user_id, email').in('auth_user_id', authorIds),
      ]).then(([ownersRes, expertsRes]) => {
        for (const c of ownersRes.data || []) authorEmailMap[c.auth_user_id] = c.email
        for (const p of expertsRes.data || []) authorEmailMap[p.auth_user_id] = p.email
      })
    )
  }

  await Promise.all(secondaryPromises)

  const inquiries: InquiryItem[] = (rawInquiries || []).map((i) => ({
    ...i,
    author_email: i.author_id ? authorEmailMap[i.author_id] || null : null,
  }))

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <h1 className="mb-6 text-xl font-bold text-text">대시보드</h1>

      {/* 요약 카드 */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
        <SummaryCard label="매칭 대기" value={summary.matchingWaiting} unit="건" color="text-info" />
        <SummaryCard label="매칭 진행" value={summary.proposed} unit="건" color="text-warning" />
        <SummaryCard label="진행 중" value={summary.inProgress} unit="건" color="text-primary" />
        <SummaryCard label="초빙 대기" value={summary.invitationPending} unit="건" color="text-accent" />
        <SummaryCard label="정산 대기" value={summary.settlementReady} unit="건" color="text-success" />
        <SummaryCard label="이의제기" value={summary.disputeOpen} unit="건" color="text-error" />
        <SummaryCard label="서비스 주문" value={summary.serviceOrders} unit="건" color="text-accent" />
        <SummaryCard label="문의" value={summary.inquiryOpen} unit="건" color="text-warning" />
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
        proposedTab={
          <ProposedTab matchings={proposedMatchings || []} />
        }
        progressTab={
          <ProgressTab
            deals={workingDeals || []}
            workflows={workflowData}
            messageCounts={messageCounts}
          />
        }
        invitationTab={
          <InvitationTab invitations={allInvitations || []} />
        }
        settlementTab={
          <SettlementTab
            settlements={pendingSettlements || []}
            ledgerEntries={ledgerEntries || []}
            fundBalance={summary.guaranteeFundBalance}
          />
        }
        disputeTab={
          <DisputeTab disputes={allDisputes || []} />
        }
        serviceTab={
          <ServiceTab orders={serviceOrders || []} />
        }
        inquiryTab={
          <InquiryTab inquiries={inquiries || []} />
        }
        urgentCount={urgentCount}
        auditCount={auditCount}
      />
    </div>
  )
}
