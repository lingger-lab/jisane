import { redirect, notFound } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { MemberDetail } from '../../member-detail'
import { getRoleHoldings } from '../../queries'

export const metadata = { title: '전문가회원 상세 | 지사네 관리자' }

const KIND_LABEL: Record<string, string> = { company: '기관/기업', senior: '시니어 개인' }
const TYPE_LABEL: Record<string, string> = {
  consulting: '컨설팅',
  legal: '법무',
  tax: '세무',
  accounting: '회계',
  insurance: '보험',
}

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('ko-KR')
}

export default async function PartnerDetailPage(props: { params: Promise<{ id: string }> }) {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const { id } = await props.params

  const { data: m } = await adminClient
    .from('provider')
    .select('id, auth_user_id, email, name, kind, type, contact, website, description, status, created_at, withdrawn_at')
    .eq('id', id)
    .maybeSingle()
  if (!m) notFound()

  const [holdings, pkgCount, orderCount] = await Promise.all([
    getRoleHoldings(m.auth_user_id),
    adminClient.from('service_package').select('id', { count: 'exact', head: true }).eq('provider_id', id),
    adminClient.from('service_order').select('id', { count: 'exact', head: true }).eq('provider_id', id),
  ])

  const profileRows = [
    { label: '이메일', value: m.email ?? '' },
    { label: '기관/성함', value: m.name },
    { label: '구분', value: KIND_LABEL[m.kind] ?? m.kind },
    { label: '분야', value: TYPE_LABEL[m.type] ?? m.type },
    { label: '연락처', value: m.contact ?? '' },
    { label: '웹사이트', value: m.website ?? '' },
    { label: '소개', value: m.description ?? '' },
    { label: '가입일', value: fmtDate(m.created_at) },
    ...(m.withdrawn_at ? [{ label: '탈퇴일', value: fmtDate(m.withdrawn_at) }] : []),
  ]
  const relatedCounts = [
    { label: '서비스', value: pkgCount.count ?? 0 },
    { label: '주문', value: orderCount.count ?? 0 },
  ]

  return (
    <MemberDetail
      role="provider"
      id={m.id}
      authUserId={m.auth_user_id}
      title={m.name}
      status={m.status}
      profileRows={profileRows}
      relatedCounts={relatedCounts}
      holdings={holdings}
    />
  )
}
