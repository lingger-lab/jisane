'use server'

import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getPackageBySlug } from '@jisane/shared/service-package/queries'
import { isConsultEligible } from '@jisane/shared/service-catalog'
import { createConsultationInquiry } from '@jisane/shared/consultation/create'

/** 상담문의 접수(시니어지식인 앱) — 비로그인 허용, 로그인 시 expert 연결(강제생성 안 함). */
export async function submitConsultInquiry(
  _prev: { ok?: boolean; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  const slug = formData.get('slug') as string | null
  if (!slug) return { error: '서비스 정보가 없습니다.' }

  const pkg = await getPackageBySlug(slug)
  if (!pkg || pkg.targetAudience !== 'expert' || !isConsultEligible(pkg)) {
    return { error: '유효하지 않은 서비스입니다.' }
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  let expertId: string | null = null
  if (user) {
    const { data: expert } = await adminClient
      .from('expert')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()
    expertId = (expert?.id as string | undefined) ?? null
  }

  const result = await createConsultationInquiry(
    {
      name: formData.get('name') as string | null,
      phone: formData.get('phone') as string | null,
      detail: formData.get('detail') as string | null,
      privacyConsent: formData.get('privacy_consent') === 'on',
      marketingConsent: formData.get('marketing_consent') === 'on',
      honeypot: formData.get('company_website') as string | null,
    },
    {
      packageId: pkg.id ?? null,
      packageSlug: pkg.slug,
      packageName: pkg.name,
      category: pkg.category,
      providerId: pkg.providerId,
      expertId,
    },
  )

  return result.ok ? { ok: true } : { error: result.error }
}
