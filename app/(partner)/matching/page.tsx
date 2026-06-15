import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { SuccessToast } from '@/components/toast'
import type { MatchingStatus } from '@/lib/types'

const STATUS_LABELS: Record<MatchingStatus, string> = {
  proposed: '제안',
  accepted: '수락',
  rejected: '거절',
}

const STATUS_COLORS: Record<MatchingStatus, string> = {
  proposed: 'bg-info-light text-info',
  accepted: 'bg-success-light text-success',
  rejected: 'bg-surface text-text-subtle',
}

export default async function MatchingListPage() {
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

  const { data: matchings } = await adminClient
    .from('matching')
    .select('id, status, created_at, request:request!inner(id, title, req_type, budget_hope)')
    .eq('partner_id', partner.id)
    .order('created_at', { ascending: false })

  const matchingList = ((matchings || []) as unknown) as Array<{
    id: string
    status: MatchingStatus
    created_at: string
    request: { id: string; title: string; req_type: string | null; budget_hope: number | null }
  }>

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <Suspense><SuccessToast /></Suspense>
      <h1 className="mb-6 text-2xl font-bold text-accent">매칭 제안</h1>

      {matchingList.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-text-muted">아직 매칭 제안이 없습니다.</p>
          <p className="text-xs text-text-subtle">
            곁에 매니저가 적합한 의뢰를 연결해드립니다.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {matchingList.map((m, i) => (
            <li key={m.id} className={`animate-fade-in stagger-${Math.min(i + 1, 5)}`}>
              <Link
                href={`/matching/${m.id}`}
                className="block rounded-xl border border-border-light p-4 shadow-xs card-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-text">
                      {m.request.title}
                    </h3>
                    <p className="mt-1 text-xs text-text-muted">
                      {new Date(m.created_at).toLocaleDateString('ko-KR')}
                      {m.request.req_type && ` · ${m.request.req_type}`}
                    </p>
                    {m.request.budget_hope && (
                      <p className="mt-1 text-sm font-medium text-text">
                        작업비: {m.request.budget_hope.toLocaleString('ko-KR')}원
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[m.status]
                    }`}
                  >
                    {STATUS_LABELS[m.status]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
