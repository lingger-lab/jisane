import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { PageHero } from '@jisane/ui/page-hero'
import { OwnerProfileForm } from '../mypage/owner-profile-form'

export const metadata = { title: '기업회원 시작 | 지사네' }

export default async function OwnerRegisterPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: owner } = await adminClient
    .from('owner')
    .select('company, ceo_name, contact, region, industry, status')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  // 이미 정보를 갖춘 활성 기업회원이면 마이페이지로.
  if (owner && owner.status !== 'withdrawn' && owner.company) redirect('/mypage')

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero
        eyebrow="기업회원"
        title="기업회원으로 시작하기"
        subtitle="회사 정보만 입력하면 바로 이용할 수 있습니다."
      />
      <div className="container-form px-4 md:px-6 py-6">
        <p className="mb-5 rounded-xl border border-border-light bg-surface-warm p-4 text-sm leading-relaxed text-text-muted">
          시니어지식인·전문가로 이미 가입돼 있어도 같은 계정으로 기업회원을 함께 이용할 수 있습니다.
          아래 회사 정보만 입력하면 전환이 완료됩니다.
        </p>
        <OwnerProfileForm
          defaults={{
            company: owner?.company ?? '',
            ceo_name: owner?.ceo_name ?? '',
            contact: owner?.contact ?? '',
            region: owner?.region ?? '',
            industry: owner?.industry ?? '',
          }}
        />
      </div>
    </div>
  )
}
