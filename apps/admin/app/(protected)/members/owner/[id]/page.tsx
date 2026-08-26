import { redirect, notFound } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { MemberDetail } from '../../member-detail'
import { getRoleHoldings } from '../../queries'

export const metadata = { title: '기업회원 상세 | 지사네 관리자' }

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('ko-KR')
}

export default async function OwnerDetailPage(props: { params: Promise<{ id: string }> }) {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const { id } = await props.params

  const { data: m } = await adminClient
    .from('owner')
    .select('id, auth_user_id, email, company, ceo_name, region, industry, contact, status, completed_deals, created_at, withdrawn_at')
    .eq('id', id)
    .maybeSingle()
  if (!m) notFound()

  const [holdings, reqCount, orderCount] = await Promise.all([
    getRoleHoldings(m.auth_user_id),
    adminClient.from('request').select('id', { count: 'exact', head: true }).eq('owner_id', id),
    adminClient.from('service_order').select('id', { count: 'exact', head: true }).eq('owner_id', id),
  ])

  const profileRows = [
    { label: '이메일', value: m.email },
    { label: '회사명', value: m.company ?? '' },
    { label: '대표', value: m.ceo_name ?? '' },
    { label: '지역', value: m.region ?? '' },
    { label: '업종', value: m.industry ?? '' },
    { label: '연락처', value: m.contact ?? '' },
    { label: '가입일', value: fmtDate(m.created_at) },
    ...(m.withdrawn_at ? [{ label: '탈퇴일', value: fmtDate(m.withdrawn_at) }] : []),
  ]
  const relatedCounts = [
    { label: '의뢰', value: reqCount.count ?? 0 },
    { label: '완료거래', value: m.completed_deals },
    { label: '서비스주문', value: orderCount.count ?? 0 },
  ]

  return (
    <MemberDetail
      role="owner"
      id={m.id}
      authUserId={m.auth_user_id}
      title={m.company || m.email}
      status={m.status}
      profileRows={profileRows}
      relatedCounts={relatedCounts}
      holdings={holdings}
    />
  )
}
