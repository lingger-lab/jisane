'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getPackageBySlug } from '@jisane/shared/service-catalog'

interface CreateEducationOrderState {
  error?: string
}

export async function createEducationOrder(
  _prev: CreateEducationOrderState,
  formData: FormData
): Promise<CreateEducationOrderState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다. 상단의 로그인 버튼을 이용해주세요.' }
  }

  const slug = formData.get('slug') as string | null
  const detail = formData.get('detail') as string | null

  if (!slug) {
    return { error: '과정 정보가 없습니다.' }
  }

  const pkg = getPackageBySlug(slug)
  if (!pkg || pkg.targetAudience !== 'partner') {
    return { error: '유효하지 않은 교육 과정입니다.' }
  }

  // partner_id 조회
  const { data: partner } = await adminClient
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner) {
    redirect('/register')
  }

  const { error } = await adminClient.from('service_order').insert({
    partner_id: partner.id,
    category: pkg.category,
    package_slug: pkg.slug,
    package_name: pkg.name,
    price: pkg.price,
    detail: detail?.trim() || null,
  })

  if (error) {
    return { error: '수강 신청에 실패했습니다. 다시 시도해주세요.' }
  }

  redirect('/matching?success=education_ordered')
}
