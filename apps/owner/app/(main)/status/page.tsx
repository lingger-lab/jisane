import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { SuccessToast } from '@jisane/ui/toast'
import type { RequestRow } from '@jisane/shared/types'

const STATUS_LABELS: Record<string, string> = {
  open: '접수',
  matching: '매칭 중',
  dealt: '진행 중',
  closed: '완료',
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-info-light text-info',
  matching: 'bg-warning-light text-warning',
  dealt: 'bg-success-light text-success',
  closed: 'bg-surface text-text-subtle',
}

const STRIPE_COLORS: Record<string, string> = {
  open: 'border-l-info',
  matching: 'border-l-warning',
  dealt: 'border-l-success',
  closed: 'border-l-border',
}

export default async function StatusPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // client_id 조회
  const { data: client } = await adminClient
    .from('client')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!client) {
    redirect('/')
  }

  // 의뢰 목록 조회
  const { data: requests } = await adminClient
    .from('request')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  const requestList = (requests || []) as RequestRow[]

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <Suspense><SuccessToast /></Suspense>
      <h1 className="mb-6 text-2xl font-bold text-primary">의뢰 현황</h1>

      {requestList.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-text-muted">아직 등록한 의뢰가 없습니다.</p>
          <Link
            href="/request"
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md btn-press"
          >
            일 맡기기
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {requestList.map((req, i) => (
            <li key={req.id} className={`animate-fade-in stagger-${Math.min(i + 1, 5)}`}>
              <Link
                href={`/status/${req.id}`}
                className={`block rounded-xl border border-border-light border-l-4 ${STRIPE_COLORS[req.status] || 'border-l-border'} p-4 shadow-xs card-hover`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-text">{req.title}</h3>
                    <p className="mt-1 text-xs text-text-muted">
                      {new Date(req.created_at).toLocaleDateString('ko-KR')}
                      {req.req_type && ` · ${req.req_type}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[req.status] || 'bg-surface text-text-subtle'
                    }`}
                  >
                    {STATUS_LABELS[req.status] || req.status}
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
