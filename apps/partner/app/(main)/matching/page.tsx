import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { SuccessToast } from '@jisane/ui/toast'
import type { MatchingStatus } from '@jisane/shared/types'

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
    .select('id, name, field')
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

  const proposedCount = matchingList.filter((m) => m.status === 'proposed').length

  const { count: workingCount } = await adminClient
    .from('deal')
    .select('id', { count: 'exact', head: true })
    .eq('partner_id', partner.id)
    .eq('status', 'working')

  const profileIncomplete = !partner.field

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <Suspense><SuccessToast /></Suspense>

      {/* 대시보드 헤더 */}
      <div className="mb-5">
        <p className="text-lg font-bold text-text">
          안녕하세요, {partner.name || '시니어'}님
        </p>
        <p className="text-xs text-text-muted">지사네 시니어공간</p>
      </div>

      {/* 프로필 미완성 배너 */}
      {profileIncomplete && (
        <Link
          href="/mypage"
          className="mb-4 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 transition-colors hover:bg-warning/10"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/15 text-sm">!</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-text">프로필을 완성해주세요</p>
            <p className="text-xs text-text-muted">전문 분야를 등록하면 매칭 확률이 높아집니다</p>
          </div>
          <span className="text-xs font-medium text-warning">완성하기</span>
        </Link>
      )}

      {/* 요약 카드 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border-light bg-surface-warm p-4 text-center">
          <p className="text-2xl font-bold text-accent">{proposedCount}</p>
          <p className="text-xs text-text-muted">새 매칭 제안</p>
        </div>
        <Link href="/work" className="rounded-xl border border-border-light bg-surface-warm p-4 text-center transition-colors hover:bg-surface">
          <p className="text-2xl font-bold text-accent">{workingCount || 0}</p>
          <p className="text-xs text-text-muted">진행 중 작업</p>
        </Link>
      </div>

      {/* 매칭 리스트 */}
      <h2 className="mb-3 text-base font-bold text-text">매칭 제안</h2>

      {matchingList.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center py-12">
          <p className="text-text-muted">아직 매칭 제안이 없습니다.</p>
          <p className="text-xs text-text-subtle max-w-xs">
            {profileIncomplete
              ? '프로필을 완성하면 지사네 매니저가 적합한 의뢰를 연결해드립니다.'
              : '지사네 매니저가 적합한 의뢰를 연결해드립니다.'}
          </p>
          {profileIncomplete && (
            <Link
              href="/mypage"
              className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md btn-press"
            >
              프로필 완성하기
            </Link>
          )}
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
