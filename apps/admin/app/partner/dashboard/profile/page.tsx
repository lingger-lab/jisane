import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { PROVIDER_KIND_LABELS, PROVIDER_TYPE_LABELS } from '@jisane/shared/labels'
import { DangerZone } from '@jisane/ui/danger-zone'
import { ProfileForm } from './profile-form'
import { withdrawProviderSelf } from '@/lib/partner/actions'

export const metadata = { title: '전문가회원 정보 | 지사네 전문가회원' }

export default async function PartnerProfilePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner')
  const provider = await getProviderByAuthUser(user.id)
  if (!provider) redirect('/partner/apply')

  return (
    <div className="animate-fade-in">
      <h1 className="mb-1 text-lg font-serif font-bold text-text">전문가회원 정보</h1>
      <p className="mb-5 text-sm text-text-muted">
        {PROVIDER_KIND_LABELS[provider.kind]} · {PROVIDER_TYPE_LABELS[provider.type]} —
        유형·분야 변경은 관리자에게 문의해주세요.
      </p>
      <ProfileForm
        defaults={{
          name: provider.name,
          contact: provider.contact ?? '',
          website: provider.website ?? '',
          description: provider.description ?? '',
        }}
      />

      <div className="mt-8">
        <DangerZone
          title="전문가회원 탈퇴"
          description={
            <>
              탈퇴하면 기관 정보가 즉시 익명화되고 등록한 서비스는 노출이 중단됩니다. 복구할 수 없습니다.
              기업회원·시니어지식인 등 다른 역할은 유지됩니다. 거래·정산 기록은 법령에 따라 5년간 보존됩니다.
            </>
          }
          buttonLabel="전문가회원 탈퇴"
          confirmMessage="전문가회원에서 탈퇴합니다. 기관 정보가 익명화되고 서비스 노출이 중단되며 복구할 수 없습니다. 계속할까요?"
          action={withdrawProviderSelf}
        />
      </div>
    </div>
  )
}
