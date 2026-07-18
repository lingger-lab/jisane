import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { INVITATION_STATUS_LABELS } from '@jisane/shared/labels'
import type { InvitationWithOwner } from '@jisane/shared/query-types'
import { SuccessToast } from '@jisane/ui/toast'

const STATUS_COLORS: Record<string, string> = {
  invited: 'bg-info-light text-info',
  accepted: 'bg-success-light text-success',
  declined: 'bg-error-light text-error',
}

export const metadata = {
  title: '초빙 현황 - 지사네 전문가',
}

export default async function InvitationsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: expert } = await adminClient
    .from('expert')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!expert) redirect('/register')

  const { data: invitations } = await adminClient
    .from('invitation')
    .select('id, status, est_hours, est_amount, cap_amount, created_at, owner:owner!inner(id, company, ceo_name, email, completed_deals), request:request(id, title, detail, req_type, budget_hope)')
    .eq('expert_id', expert.id)
    .order('created_at', { ascending: false })
    .limit(20)
    .returns<InvitationWithOwner[]>()

  const items = invitations ?? []

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <Suspense><SuccessToast /></Suspense>
      <h1 className="mb-2 text-xl font-bold text-accent">초빙 현황</h1>
      <p className="mb-5 text-sm text-text-muted">
        기업으로부터 받은 초빙 요청을 확인하세요.
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-12 text-center">
          <p className="text-sm text-text-muted">아직 초빙 요청이 없습니다.</p>
          <p className="text-xs text-text-subtle">기업이 전문가를 탐색한 뒤 초빙을 보내면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/invitations/${inv.id}`}
                className="block rounded-xl border border-border-light p-4 shadow-xs card-hover"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text">
                      {inv.owner.company ?? inv.owner.ceo_name ?? inv.owner.email}
                    </p>
                    {inv.request && (
                      <p className="mt-0.5 text-xs text-text-muted truncate">{inv.request.title}</p>
                    )}
                    <p className="mt-1 text-xs text-text-subtle">
                      {new Date(inv.created_at).toLocaleDateString('ko-KR')}
                      {inv.owner.completed_deals > 0 && ` · 거래 ${inv.owner.completed_deals}건`}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[inv.status] ?? 'bg-surface text-text-subtle'}`}>
                    {INVITATION_STATUS_LABELS[inv.status] ?? inv.status}
                  </span>
                </div>
                {inv.cap_amount != null && (
                  <p className="mt-2 text-xs text-accent font-medium">
                    예상 {inv.est_hours}시간 · {inv.cap_amount.toLocaleString('ko-KR')}원
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
