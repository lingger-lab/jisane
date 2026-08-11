import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import type { DealStatus } from '@jisane/shared/types'
import { DEAL_STATUS_LABELS } from '@jisane/shared/labels'
import { DEAL_STATUS_BADGE_CLASSES } from '@jisane/shared/status-badges'
import { PageHero } from '@jisane/ui/page-hero'

const STRIPE_COLORS: Record<DealStatus, string> = {
  quoted: 'border-l-info',
  working: 'border-l-warning',
  done: 'border-l-success',
}

export default async function WorkListPage() {
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

  const { data: deals } = await adminClient
    .from('deal')
    .select('id, status, work_fee, due_date, created_at, request:request!inner(id, title, req_type)')
    .eq('expert_id', expert.id)
    .order('created_at', { ascending: false })

  const dealList = ((deals || []) as unknown) as Array<{
    id: string
    status: DealStatus
    work_fee: number
    due_date: string | null
    created_at: string
    request: { id: string; title: string; req_type: string | null }
  }>

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero
        eyebrow="시니어지식인회원"
        title="작업 현황"
        subtitle="진행 중인 작업을 확인하고 단계를 관리하세요."
      />
      <div className="responsive-container px-4 md:px-6 py-6">
      {dealList.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-text-muted">아직 진행 중인 작업이 없습니다.</p>
          <Link
            href="/matching"
            className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md btn-press"
          >
            매칭 제안 확인
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {dealList.map((d, i) => (
            <li key={d.id} className={`animate-fade-in stagger-${Math.min(i + 1, 5)}`}>
              <Link
                href={`/work/${d.id}`}
                className={`block rounded-xl border border-border-light border-l-4 ${STRIPE_COLORS[d.status]} p-4 shadow-xs card-hover`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-text">
                      {d.request.title}
                    </h3>
                    <p className="mt-1 text-xs text-text-muted">
                      {new Date(d.created_at).toLocaleDateString('ko-KR')}
                      {d.request.req_type && ` · ${d.request.req_type}`}
                    </p>
                    <p className="mt-1 text-sm font-medium text-text">
                      작업비: {d.work_fee.toLocaleString('ko-KR')}원
                    </p>
                    {d.due_date && (
                      <p className="text-xs text-text-muted">
                        납기: {new Date(d.due_date).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      DEAL_STATUS_BADGE_CLASSES[d.status]
                    }`}
                  >
                    {DEAL_STATUS_LABELS[d.status]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  )
}
