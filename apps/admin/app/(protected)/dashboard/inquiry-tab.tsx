'use client'

import { useState } from 'react'
import { closeInquiry } from '@/lib/admin/actions'

interface InquiryItem {
  id: string
  author_id: string | null
  author_type: string | null
  author_email: string | null
  category: string | null
  content: string
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: '대기', color: 'bg-error-light text-error' },
  ai_answered: { label: 'AI 응답', color: 'bg-info-light text-info' },
  human_routed: { label: '사람 연결', color: 'bg-warning-light text-warning' },
  closed: { label: '종료', color: 'bg-surface text-text-muted' },
}

function parseCategoryLabel(category: string | null): { label: string; color: string } {
  if (!category) return { label: '일반', color: 'bg-surface text-text-muted' }
  if (category.startsWith('deal_quote:')) return { label: '견적 상의', color: 'bg-warning-light text-warning' }
  if (category.startsWith('deal_issue:')) return { label: '문제 신고', color: 'bg-error-light text-error' }
  if (category.startsWith('matching:')) return { label: '매칭 문의', color: 'bg-info-light text-info' }
  return { label: category, color: 'bg-surface text-text-muted' }
}

export function InquiryTab({ inquiries }: { inquiries: InquiryItem[] }) {
  const [closedIds, setClosedIds] = useState<Set<string>>(new Set())
  const [closingId, setClosingId] = useState<string | null>(null)

  async function handleClose(inquiryId: string) {
    setClosingId(inquiryId)
    const result = await closeInquiry(inquiryId)
    if (!result.error) {
      setClosedIds((prev) => new Set(prev).add(inquiryId))
    }
    setClosingId(null)
  }

  if (inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-12 text-center">
        <span className="text-2xl">&#128172;</span>
        <p className="text-sm text-text-muted">문의가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {inquiries.map((inq) => {
        const effectiveStatus = closedIds.has(inq.id) ? 'closed' : inq.status
        const statusInfo = STATUS_LABELS[effectiveStatus] || STATUS_LABELS.open
        const categoryInfo = parseCategoryLabel(inq.category)
        const canClose = effectiveStatus === 'open' || effectiveStatus === 'human_routed'

        return (
          <div key={inq.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-text">{inq.content}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
                  {inq.author_type && (
                    <span className="rounded bg-surface px-2 py-0.5">
                      {inq.author_type === 'owner' ? '기업' : '전문가'}
                    </span>
                  )}
                  {inq.author_email && (
                    <a href={`mailto:${inq.author_email}`} className="rounded px-1 py-0.5 hover:text-accent hover:bg-accent/5 transition-colors">{inq.author_email}</a>
                  )}
                  <span className={`rounded px-2 py-0.5 ${categoryInfo.color}`}>
                    {categoryInfo.label}
                  </span>
                  <span>{new Date(inq.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
              <div className="ml-3 flex shrink-0 flex-col items-end gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                {canClose && (
                  <button
                    type="button"
                    onClick={() => handleClose(inq.id)}
                    disabled={closingId === inq.id}
                    className="rounded-lg border border-border-light px-2.5 py-1 text-xs text-text-muted transition-colors hover:bg-surface disabled:opacity-50"
                  >
                    {closingId === inq.id ? '...' : '종료'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
