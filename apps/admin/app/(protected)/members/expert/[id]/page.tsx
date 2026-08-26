import { redirect, notFound } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { MemberDetail } from '../../member-detail'
import { getRoleHoldings } from '../../queries'

export const metadata = { title: '시니어지식인 상세 | 지사네 관리자' }

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('ko-KR')
}

export default async function ExpertDetailPage(props: { params: Promise<{ id: string }> }) {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const { id } = await props.params

  const { data: m } = await adminClient
    .from('expert')
    .select('id, auth_user_id, email, real_name, name, field, career_years, hourly_rate, grade, total_score, contact, status, created_at, withdrawn_at')
    .eq('id', id)
    .maybeSingle()
  if (!m) notFound()

  const [holdings, matchingCount, dealCount, orderCount] = await Promise.all([
    getRoleHoldings(m.auth_user_id),
    adminClient.from('matching').select('id', { count: 'exact', head: true }).eq('expert_id', id),
    adminClient.from('deal').select('id', { count: 'exact', head: true }).eq('expert_id', id),
    adminClient.from('service_order').select('id', { count: 'exact', head: true }).eq('expert_id', id),
  ])

  const profileRows = [
    { label: '이메일', value: m.email },
    { label: '실명', value: m.real_name ?? '' },
    { label: '활동명', value: m.name ?? '' },
    { label: '전문분야', value: m.field ?? '' },
    { label: '경력', value: m.career_years != null ? `${m.career_years}년` : '' },
    { label: '단가', value: m.hourly_rate != null ? `${m.hourly_rate.toLocaleString('ko-KR')}원/시간` : '' },
    { label: '등급', value: m.grade === 'veteran' ? '베테랑' : m.grade === 'new' ? '신규' : '스탠다드' },
    { label: '종합점수', value: m.total_score != null ? m.total_score.toFixed(1) : '' },
    { label: '연락처', value: m.contact ?? '' },
    { label: '가입일', value: fmtDate(m.created_at) },
    ...(m.withdrawn_at ? [{ label: '탈퇴일', value: fmtDate(m.withdrawn_at) }] : []),
  ]
  const relatedCounts = [
    { label: '매칭', value: matchingCount.count ?? 0 },
    { label: '거래', value: dealCount.count ?? 0 },
    { label: '서비스주문', value: orderCount.count ?? 0 },
  ]

  return (
    <MemberDetail
      role="expert"
      id={m.id}
      authUserId={m.auth_user_id}
      title={m.real_name || m.name || m.email}
      status={m.status}
      profileRows={profileRows}
      relatedCounts={relatedCounts}
      holdings={holdings}
    />
  )
}
