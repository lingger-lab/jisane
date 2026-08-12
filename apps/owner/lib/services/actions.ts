'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getPackageBySlug } from '@jisane/shared/service-package/queries'
import { notifyAdmin } from '@jisane/shared/notify/email'

interface CreateServiceOrderState {
  error?: string
}

export async function createServiceOrder(
  _prev: CreateServiceOrderState,
  formData: FormData
): Promise<CreateServiceOrderState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다. 상단의 로그인 버튼을 이용해주세요.' }
  }

  const slug = formData.get('slug') as string | null
  const detail = formData.get('detail') as string | null

  if (!slug) {
    return { error: '패키지 정보가 없습니다.' }
  }

  const pkg = await getPackageBySlug(slug)
  if (!pkg || pkg.targetAudience !== 'owner') {
    return { error: '유효하지 않은 서비스입니다.' }
  }

  // owner_id 조회 (없으면 자동 생성)
  let { data: owner } = await adminClient
    .from('owner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!owner) {
    const provider = (user.app_metadata?.provider as string) || 'google'
    const { data: newOwner } = await adminClient
      .from('owner')
      .insert({ auth_user_id: user.id, provider, email: user.email! })
      .select('id')
      .single()
    owner = newOwner
  }

  if (!owner) {
    return { error: '계정 생성에 실패했습니다. 다시 시도해주세요.' }
  }

  const { error } = await adminClient.from('service_order').insert({
    owner_id: owner.id,
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
    return { error: '서비스 신청에 실패했습니다. 다시 시도해주세요.' }
  }

  // 관리자에게 새 상담 리드 통지 (fire-and-forget — 비활성/실패해도 신청 흐름 비차단, P1-2).
  await notifyAdmin(
    `새 상담 신청 · ${pkg.name}`,
    `${pkg.isFree ? '무료' : `${pkg.price.toLocaleString('ko-KR')}원`} · ${pkg.name}\n` +
      `신청자: ${user.email}\n` +
      (detail?.trim() ? `요청사항: ${detail.trim()}\n` : '') +
      `관리자 대시보드 주문 탭에서 확인하세요.`,
  )

  redirect('/status?success=service_ordered')
}
