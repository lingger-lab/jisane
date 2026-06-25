'use client'

interface InquiryItem {
  id: string
  author_type: string | null
  category: string | null
  content: string
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: '대기', color: 'bg-red-100 text-red-700' },
  ai_answered: { label: 'AI 응답', color: 'bg-blue-100 text-blue-700' },
  human_routed: { label: '사람 연결', color: 'bg-yellow-100 text-yellow-700' },
  closed: { label: '종료', color: 'bg-gray-100 text-gray-600' },
}

export function InquiryTab({ inquiries }: { inquiries: InquiryItem[] }) {
  if (inquiries.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">문의가 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {inquiries.map((inq) => {
        const statusInfo = STATUS_LABELS[inq.status] || STATUS_LABELS.open
        return (
          <div key={inq.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-text">{inq.content}</p>
                <div className="mt-2 flex gap-2 text-xs text-text-muted">
                  {inq.author_type && (
                    <span className="rounded bg-surface px-2 py-0.5">
                      {inq.author_type === 'client' ? '기업' : '시니어'}
                    </span>
                  )}
                  {inq.category && (
                    <span className="rounded bg-surface px-2 py-0.5">{inq.category}</span>
                  )}
                  <span>{new Date(inq.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
