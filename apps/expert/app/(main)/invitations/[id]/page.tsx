import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { INVITATION_STATUS_LABELS } from '@jisane/shared/labels'
import type { InvitationWithOwner } from '@jisane/shared/query-types'
import { PageHero } from '@jisane/ui/page-hero'
import { InvitationActions } from './invitation-actions'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata() {
  // 초빙 상세는 초빙된 전문가 본인만 보는 비공개 화면이다. 발주자 회사·대표명을 인증 없이
  // 메타데이터로 노출하면 URL만 아는 누구에게나 새므로 일반 제목만 반환한다(감사 docs/10 P2-20,
  // docs/11 P3-44). 소유권/인증은 페이지 본문에서 수행.
  return { title: '초빙 상세 | 지사네 시니어지식인' }
}

export default async function InvitationDetailPage(props: PageProps) {
  const { id } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: expert } = await adminClient
    .from('expert')
    .select('id, hourly_rate')
    .eq('auth_user_id', user.id)
    .single()

  if (!expert) redirect('/register')

  const { data: invitation } = await adminClient
    .from('invitation')
    .select('id, status, est_hours, est_amount, cap_amount, created_at, owner:owner!inner(id, company, ceo_name, email, completed_deals), request:request(id, title, detail, req_type, budget_hope)')
    .eq('id', id)
    .returns<InvitationWithOwner[]>()
    .single()

  if (!invitation) notFound()

  // 소유권 확인 — 이 초빙이 현재 expert에게 온 것인지
  const { count } = await adminClient
    .from('invitation')
    .select('id', { count: 'exact', head: true })
    .eq('id', id)
    .eq('expert_id', expert.id)

  if (!count || count === 0) notFound()

  const hourlyRate = expert.hourly_rate ?? 25000

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero
        eyebrow="시니어지식인회원"
        title={invitation.owner.company ?? invitation.owner.ceo_name ?? '기업'}
        subtitle={`${new Date(invitation.created_at).toLocaleDateString('ko-KR')} 초빙 요청`}
        back={<Link href="/invitations" className="text-sm text-white/70 hover:text-white transition-colors">&larr; 초빙 목록</Link>}
      />
      <div className="responsive-container px-4 md:px-6 py-6">
      {/* 기업 정보 */}
      <section className="rounded-xl border border-border-light bg-surface-warm p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-text">기업 정보</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            invitation.status === 'invited'
              ? 'bg-info-light text-info'
              : invitation.status === 'accepted'
                ? 'bg-success-light text-success'
                : 'bg-error-light text-error'
          }`}>
            {INVITATION_STATUS_LABELS[invitation.status] ?? invitation.status}
          </span>
        </div>
        <p className="mt-2 font-medium text-text">{invitation.owner.company ?? invitation.owner.ceo_name ?? '기업'}</p>
        <p className="mt-1 text-xs text-text-muted">{invitation.owner.email}</p>
        <div className="mt-2 flex gap-2 text-xs text-text-subtle">
          <span>{new Date(invitation.created_at).toLocaleDateString('ko-KR')} 요청</span>
          {invitation.owner.completed_deals > 0 && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">
              거래 {invitation.owner.completed_deals}건
            </span>
          )}
        </div>
      </section>

      {/* 의뢰 정보 (연결된 request가 있는 경우) */}
      {invitation.request && (
        <section className="mt-4 rounded-xl border border-border-light bg-background p-4 shadow-sm">
          <h2 className="text-sm font-bold text-text">연결된 의뢰</h2>
          <p className="mt-1 font-medium text-text">{invitation.request.title}</p>
          <p className="mt-1 text-xs text-text-muted line-clamp-3">{invitation.request.detail}</p>
          <div className="mt-2 flex gap-2 text-xs text-text-subtle">
            {invitation.request.req_type && <span>{invitation.request.req_type}</span>}
            {invitation.request.budget_hope != null && (
              <span>예산 {invitation.request.budget_hope.toLocaleString('ko-KR')}원</span>
            )}
          </div>
        </section>
      )}

      {/* 캡 가격 정보 (수락 시 표시) */}
      {invitation.cap_amount != null && (
        <section className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
          <h2 className="text-sm font-bold text-accent">수락 정보</h2>
          <div className="mt-2 grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-xs text-text-muted">예상 시간</p>
              <p className="font-bold text-text">{invitation.est_hours}h</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">시간당 단가</p>
              <p className="font-bold text-text">{(invitation.est_amount! / invitation.est_hours!).toLocaleString('ko-KR')}원</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">캡 금액</p>
              <p className="font-bold text-accent">{invitation.cap_amount.toLocaleString('ko-KR')}원</p>
            </div>
          </div>
        </section>
      )}

      {/* 수락/거절 액션 (초빙 대기 상태일 때만) */}
      {invitation.status === 'invited' && (
        <InvitationActions
          invitationId={invitation.id}
          hourlyRate={hourlyRate}
        />
      )}
      </div>
    </div>
  )
}
