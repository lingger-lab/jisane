import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { WorkflowChecklist } from '@/components/workflow-checklist'
import type { DealRow, DealWorkflowRow, RequestRow, SettlementRow } from '@/lib/types'
import { WorkflowForm } from './workflow-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WorkDetailPage(props: PageProps) {
  const { id: dealId } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: partner } = await adminClient
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner) redirect('/register')

  // deal 조회 (소유권 확인)
  const { data: deal } = await adminClient
    .from('deal')
    .select('*')
    .eq('id', dealId)
    .eq('partner_id', partner.id)
    .single()

  if (!deal) redirect('/work')

  const d = deal as DealRow

  // 의뢰 정보
  let request: RequestRow | null = null
  if (d.request_id) {
    const { data: req } = await adminClient
      .from('request')
      .select('*')
      .eq('id', d.request_id)
      .single()
    request = req as RequestRow | null
  }

  // 워크플로우
  const { data: workflows } = await adminClient
    .from('deal_workflow')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })

  const steps = (workflows || []) as DealWorkflowRow[]

  // 정산 정보
  const { data: settlement } = await adminClient
    .from('settlement')
    .select('*')
    .eq('deal_id', dealId)
    .single()

  const settle = settlement as SettlementRow | null

  const allStepsDone = steps.length === 5 && steps.every((s) => s.status === 'done')

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <Link href="/work" className="mb-4 text-sm text-text-muted hover:text-text">
        &larr; 작업 목록
      </Link>

      <h1 className="mb-2 text-xl font-bold text-text">
        {request?.title || '작업 상세'}
      </h1>
      {request?.req_type && (
        <p className="mb-4 text-xs text-text-muted">분야: {request.req_type}</p>
      )}

      {/* 작업비 — work_fee만 표시 */}
      <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4 text-center">
        <p className="text-sm text-text-muted">작업비</p>
        <p className="text-2xl font-bold text-accent">
          {d.work_fee.toLocaleString('ko-KR')}
          <span className="text-base font-normal">원</span>
        </p>
        {settle && (
          <p className="mt-1 text-xs text-text-muted">
            {settle.escrow_status === 'deposited'
              ? '에스크로 안전 보관 중'
              : settle.escrow_status === 'released'
              ? '정산 완료'
              : settle.escrow_status === 'reviewing'
              ? '검수 진행 중'
              : '결제 대기'}
          </p>
        )}
      </div>

      {/* 납기일 */}
      {d.due_date && (
        <p className="mb-4 text-sm text-text-muted">
          납기일: {new Date(d.due_date).toLocaleDateString('ko-KR')}
        </p>
      )}

      {/* 워크플로우 5단계 */}
      <div className="mb-4">
        <h2 className="mb-3 text-sm font-semibold text-text">작업 진행 단계</h2>
        {d.status === 'working' ? (
          <WorkflowForm dealId={dealId} steps={steps} />
        ) : (
          <WorkflowChecklist steps={steps} />
        )}
      </div>

      {/* 작업 제출 안내 */}
      {allStepsDone && d.status === 'working' && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
          <p className="font-semibold text-green-700">모든 단계 완료</p>
          <p className="mt-1 text-xs text-green-600">
            곁에 매니저가 확인 후 사장님 검수 단계로 전환합니다.
          </p>
        </div>
      )}

      {/* 완료 상태 */}
      {d.status === 'done' && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <h2 className="mb-2 font-semibold text-green-700">작업 완료</h2>
          <p className="text-sm text-green-600">
            {settle?.escrow_status === 'released'
              ? `정산 완료 — ${d.work_fee.toLocaleString('ko-KR')}원이 지급되었습니다.`
              : '곁에 검토진 확인 중입니다. 정산이 곧 진행됩니다.'}
          </p>
        </div>
      )}

      {/* 의뢰 상세 */}
      {request && (
        <div className="mt-4 rounded-lg border border-border p-4">
          <h3 className="mb-2 text-sm font-semibold text-text">의뢰 내용</h3>
          <p className="whitespace-pre-wrap text-sm text-text-muted">{request.detail}</p>
        </div>
      )}
    </div>
  )
}
