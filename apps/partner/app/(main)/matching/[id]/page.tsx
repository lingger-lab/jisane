import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import type { RequestRow } from '@jisane/shared/types'
import { MatchingActions } from './matching-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MatchingDetailPage(props: PageProps) {
  const { id } = await props.params

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

  // 매칭 조회 (소유권 확인)
  const { data: matching } = await adminClient
    .from('matching')
    .select('id, status, request_id, partner_id, created_at')
    .eq('id', id)
    .eq('partner_id', partner.id)
    .single()

  if (!matching) redirect('/matching')

  // 의뢰 정보
  const { data: request } = await adminClient
    .from('request')
    .select('*')
    .eq('id', matching.request_id)
    .single()

  const req = request as RequestRow | null

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <Link href="/matching" className="mb-4 text-sm text-text-muted hover:text-text">
        &larr; 매칭 목록
      </Link>

      <h1 className="mb-2 text-xl font-bold text-text">매칭 상세</h1>

      {req && (
        <>
          {/* 의뢰 정보 */}
          <div className="mb-4 rounded-lg border border-border p-4">
            <h2 className="mb-2 font-semibold text-text">{req.title}</h2>
            {req.req_type && (
              <p className="mb-2 text-xs text-text-muted">분야: {req.req_type}</p>
            )}
            <p className="whitespace-pre-wrap text-sm text-text-muted">{req.detail}</p>
            {req.scope && (
              <p className="mt-2 text-sm text-text-muted">범위: {req.scope}</p>
            )}
          </div>

          {/* 작업비 — work_fee(=budget_hope)만 표시, match_fee 비공개 */}
          {req.budget_hope && (
            <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4 text-center">
              <p className="text-sm text-text-muted">작업비</p>
              <p className="text-3xl font-bold text-accent">
                {req.budget_hope.toLocaleString('ko-KR')}
                <span className="text-base font-normal">원</span>
              </p>
              <p className="mt-1 text-xs text-text-muted">VAT 별도 · 수수료 0%</p>
            </div>
          )}
        </>
      )}

      {/* 수락/거절 버튼 */}
      {matching.status === 'proposed' ? (
        <MatchingActions matchingId={matching.id} />
      ) : (
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-sm text-text-muted">
            {matching.status === 'accepted' ? '수락된 매칭입니다.' : '거절된 매칭입니다.'}
          </p>
        </div>
      )}
    </div>
  )
}
