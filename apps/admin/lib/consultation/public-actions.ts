'use server'

import { getPackageBySlug } from '@jisane/shared/service-package/queries'
import { isConsultEligible } from '@jisane/shared/service-catalog'
import { createConsultationInquiry } from '@jisane/shared/consultation/create'

/**
 * 공개 허브(/knowledge)의 상담문의 접수 — 비로그인 익명 리드. owner/expert 양쪽 대상 모두 처리.
 * 회원 연결 없이(ownerId/expertId=null) 연락처·동의만 받는 단일 리드 경로.
 */
export async function submitHubConsultInquiry(
  _prev: { ok?: boolean; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  const slug = formData.get('slug') as string | null
  if (!slug) return { error: '서비스 정보가 없습니다.' }

  const pkg = await getPackageBySlug(slug)
  if (!pkg || !isConsultEligible(pkg)) {
    return { error: '유효하지 않은 서비스입니다.' }
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
    },
  )

  return result.ok ? { ok: true } : { error: result.error }
}
