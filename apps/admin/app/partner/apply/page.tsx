import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { ApplyForm } from './apply-form'

export const metadata = { title: '전문가회원 등록 신청 | 지사네 전문가공간' }

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
            <p className="text-3xl">&#9203;</p>
            <h1 className="mt-3 text-xl font-bold text-text">등록 신청 심사 중입니다</h1>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              {submitted ? '신청이 접수되었습니다. ' : ''}
              관리자 검토 후 승인되면 전문가회원 활동을 시작할 수 있습니다.
              보통 1~2 영업일이 소요됩니다.
            </p>
          </>
        ) : provider.status === 'rejected' ? (
          <>
            <p className="text-3xl">&#10060;</p>
            <h1 className="mt-3 text-xl font-bold text-text">등록 신청이 반려되었습니다</h1>
            <p className="mt-2 text-sm text-text-muted">자세한 사유는 문의해주세요: iamblackwhite86@gmail.com</p>
          </>
        ) : (
          <>
            <p className="text-3xl">&#9888;&#65039;</p>
            <h1 className="mt-3 text-xl font-bold text-text">전문가회원 활동이 중지되었습니다</h1>
            <p className="mt-2 text-sm text-text-muted">문의: iamblackwhite86@gmail.com</p>
          </>
        )}
        <Link href="/partner" className="mt-6 inline-block text-sm text-info hover:underline">
          전문가공간 홈으로
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10 animate-fade-in">
      <h1 className="text-xl font-bold text-text">전문가회원 등록 신청</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        신청 내용을 검토한 뒤 관리자가 승인합니다. 승인 후 서비스 등록·신청 관리가 가능합니다.
      </p>
      <ApplyForm />
    </div>
  )
}
