'use client'

interface ProposedItem {
  id: string
  status: string
  created_at: string
  request: {
    id: string
    title: string
    req_type: string | null
    budget_hope: number | null
    client: {
      company: string | null
      ceo_name: string | null
      email: string
      contact: string | null
    }
  }
  partner: {
    id: string
    name: string | null
    field: string | null
    email: string
    contact: string | null
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '방금 전'
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

export function ProposedTab({ matchings }: { matchings: ProposedItem[] }) {
  if (matchings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-12 text-center">
        <span className="text-2xl">&#9203;</span>
        <p className="text-sm text-text-muted">파트너 응답 대기 중인 매칭이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {matchings.map((m) => (
        <div key={m.id} className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-text">{m.request.title}</h3>
              <div className="mt-1 flex gap-2 text-xs text-text-muted">
                {m.request.req_type && (
                  <span className="rounded bg-surface px-2 py-0.5">{m.request.req_type}</span>
                )}
                {m.request.budget_hope && (
                  <span>{m.request.budget_hope.toLocaleString('ko-KR')}원</span>
                )}
              </div>

              <div className="mt-2 flex flex-col gap-0.5 text-xs text-text-subtle">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="text-text-muted">기업:</span>
                  {m.request.client.company && <span>{m.request.client.company}</span>}
                  {m.request.client.ceo_name && <span>{m.request.client.ceo_name}</span>}
                  {m.request.client.contact && (
                    <a href={`tel:${m.request.client.contact}`} className="rounded px-1 py-0.5 hover:text-accent hover:bg-accent/5 transition-colors">
                      {m.request.client.contact}
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="text-text-muted">파트너:</span>
                  <span className="font-medium text-text">{m.partner.name || '이름 미등록'}</span>
                  {m.partner.field && <span>{m.partner.field}</span>}
                  {m.partner.contact && (
                    <a href={`tel:${m.partner.contact}`} className="rounded px-1 py-0.5 hover:text-accent hover:bg-accent/5 transition-colors">
                      {m.partner.contact}
                    </a>
                  )}
                  <a href={`mailto:${m.partner.email}`} className="rounded px-1 py-0.5 hover:text-accent hover:bg-accent/5 transition-colors">
                    {m.partner.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="ml-3 flex flex-col items-end gap-1">
              <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                응답 대기
              </span>
              <span className="text-xs text-text-subtle">{timeAgo(m.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
