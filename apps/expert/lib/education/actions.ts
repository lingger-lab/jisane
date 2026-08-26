'use server'

import { redirect } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { resolveExpertFromAuth, requireActiveExpert } from '@jisane/shared/auth/server-helpers'
import { getPackageBySlug } from '@jisane/shared/service-package/queries'

interface CreateEducationOrderState {
  error?: string
}

export async function createEducationOrder(
  _prev: CreateEducationOrderState,
  formData: FormData
): Promise<CreateEducationOrderState> {
  const { user, expert } = await resolveExpertFromAuth()

  if (!user) {
    return { error: '로그인이 필요합니다. 상단의 로그인 버튼을 이용해주세요.' }
  }

  const slug = formData.get('slug') as string | null
  const detail = formData.get('detail') as string | null

  if (!slug) {
    return { error: '과정 정보가 없습니다.' }
  }

  const pkg = await getPackageBySlug(slug)
  if (!pkg || pkg.targetAudience !== 'expert') {
    return { error: '유효하지 않은 교육 과정입니다.' }
  }

  if (!expert) {
    redirect('/register')
  }

  // 활성 계정만 교육 주문 가능(감사 P2-1/P2-D) — 탈퇴·중지 세션 차단.
  const guard = await requireActiveExpert()
  if (!guard.ok) return { error: guard.error }

  const { error } = await adminClient.from('service_order').insert({
    expert_id: expert.id,
    category: pkg.category,
    package_slug: pkg.slug,
    package_name: pkg.name,
    price: pkg.price,
    detail: detail?.trim() || null,
    provider_id: pkg.providerId,
    is_free: pkg.isFree,
    service_package_id: pkg.id ?? null,
  })

  if (error) {
    console.error('[createEducationOrder] service_order insert failed:', error.message)
    return { error: '수강 신청에 실패했습니다. 다시 시도해주세요.' }
  }

  redirect('/matching?success=education_ordered')
}
