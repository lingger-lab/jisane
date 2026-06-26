'use client'

import Link from 'next/link'
import { WorkflowChecklist } from '@jisane/ui/workflow-checklist'
import type { DealWorkflowRow } from '@jisane/shared/types'

interface DealItem {
  id: string
  work_fee: number
  match_fee: number
  total_pay: number
  status: string
  created_at: string
  request: { id: string; title: string; req_type: string | null }
  partner: { id: string; name: string | null; field: string | null }
}

export function ProgressTab({
  deals,
  workflows,
}: {
  deals: DealItem[]
  workflows: DealWorkflowRow[]
}) {
  if (deals.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">진행 중인 거래가 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {deals.map((deal) => {
        const steps = workflows.filter((w) => w.deal_id === deal.id)
        const allDone = steps.length === 5 && steps.every((s) => s.status === 'done')

        return (
          <div key={deal.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-text">{deal.request.title}</h3>
                <div className="mt-1 flex gap-2 text-xs text-text-muted">
                  <span>파트너: {deal.partner.name || '이름 미등록'}</span>
                  <span>·</span>
                  <span>{deal.partner.field}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-accent">
                  {deal.total_pay.toLocaleString('ko-KR')}원
                </p>
                <p className="text-xs text-text-muted">
                  작업비 {deal.work_fee.toLocaleString('ko-KR')} + 매칭피 {deal.match_fee.toLocaleString('ko-KR')}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <WorkflowChecklist steps={steps} />
            </div>

            {allDone && (
              <div className="mt-3 flex items-center justify-between rounded-md bg-success-light p-2">
                <span className="text-xs font-medium text-success">모든 단계 완료</span>
                <Link
                  href={`/review-input/${deal.id}`}
                  className="rounded bg-success px-3 py-1 text-xs font-medium text-white hover:bg-success/90"
                >
                  리뷰 입력
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
