import { cookies } from 'next/headers'
import { Clock, XCircle, AlertTriangle } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { ApplyForm } from './apply-form'
import { PageHero } from '@jisane/ui/page-hero'

import { pageMetadata } from '@jisane/shared/seo'
import { EXPERT_URL } from '@/lib/urls'

export const metadata = pageMetadata('admin', {
  title: '전문가회원 등록 신청',
  description: '지사네 전문가회원(파트너) 등록 신청 — 전문 서비스를 직접 등록·제공하는 특수관계 회원 안내.',
  path: '/partner/apply',
})

export default async function PartnerApplyPage(props: {
  searchParams: Promise<{ submitted?: string }>
}) {
  const { submitted } = await props.searchParams

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/partner')
  }

  const provider = await getProviderByAuthUser(user.id)

  // 이미 신청/활동 이력이 있으면 상태 안내
  if (provider) {
    if (provider.status === 'active') redirect('/partner/dashboard')
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center animate-fade-in">
        {provider.status === 'pending' ? (
          <>
            <Clock className="mx-auto h-9 w-9 text-text-subtle" strokeWidth={1.75} aria-hidden="true" />
            <h1 className="mt-3 text-xl font-bold text-text">등록 신청 심사 중입니다</h1>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              {submitted ? '신청이 접수되었습니다. ' : ''}
              관리자 검토 후 승인되면 전문가회원 활동을 시작할 수 있습니다.
              보통 1~2 영업일이 소요됩니다.
            </p>
          </>
        ) : provider.status === 'rejected' ? (
          <>
            <XCircle className="mx-auto h-9 w-9 text-text-subtle" strokeWidth={1.75} aria-hidden="true" />
            <h1 className="mt-3 text-xl font-bold text-text">등록 신청이 반려되었습니다</h1>
            <p className="mt-2 text-sm text-text-muted">자세한 사유는 문의해주세요: iamblackwhite86@gmail.com</p>
          </>
        ) : (
          <>
            <AlertTriangle className="mx-auto h-9 w-9 text-text-subtle" strokeWidth={1.75} aria-hidden="true" />
            <h1 className="mt-3 text-xl font-bold text-text">전문가회원 활동이 중지되었습니다</h1>
            <p className="mt-2 text-sm text-text-muted">문의: iamblackwhite86@gmail.com</p>
          </>
        )}
        <div className="mt-6 flex flex-col items-center gap-3">
          {/* 반려/대기/중지 상태여도 시니어지식인(전문가)으로는 활동 가능 — dual-role 허용 */}
          <a
            href={EXPERT_URL}
            className="btn-press focus-ring inline-flex items-center gap-1 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            시니어지식인으로 가입하기 &rarr;
          </a>
          <p className="text-xs text-text-subtle">전문가회원 대신 시니어지식인(전문가)으로 활동하실 수 있습니다.</p>
          <Link href="/partner" className="text-sm text-partner hover:underline">전문가회원 홈으로</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero
        eyebrow="전문가회원"
        title="전문가회원 등록 신청"
        subtitle="신청 내용을 검토한 뒤 관리자가 승인합니다. 승인 후 서비스 등록·신청 관리가 가능합니다."
      />
      <div className="mx-auto w-full max-w-xl px-4 md:px-6 py-6">
        <ApplyForm />
      </div>
    </div>
  )
}
