import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@jisane/shared/supabase/server'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { PROVIDER_KIND_LABELS, PROVIDER_TYPE_LABELS } from '@jisane/shared/labels'
import { SuccessToast } from '@jisane/ui/toast'
import { ProfileForm } from './profile-form'

export const metadata = { title: '파트너 정보 | 지사네 파트너공간' }

export default async function PartnerProfilePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner')
  const provider = await getProviderByAuthUser(user.id)
  if (!provider) redirect('/partner/apply')

  return (
    <div className="animate-fade-in">
      <Suspense><SuccessToast /></Suspense>
      <h1 className="mb-1 text-lg font-bold text-text">파트너 정보</h1>
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
    </div>
  )
}
