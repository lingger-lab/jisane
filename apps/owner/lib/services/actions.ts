'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getPackageBySlug } from '@jisane/shared/service-catalog'

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
    redirect('/')
  }

  const slug = formData.get('slug') as string | null
  const detail = formData.get('detail') as string | null

  if (!slug) {
    return { error: '패키지 정보가 없습니다.' }
  }

  const pkg = getPackageBySlug(slug)
  if (!pkg || pkg.targetAudience !== 'owner') {
    return { error: '유효하지 않은 서비스입니다.' }
  }

  // client_id 조회 (없으면 자동 생성)
  let { data: client } = await adminClient
    .from('client')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!client) {
    const provider = (user.app_metadata?.provider as string) || 'google'
    const { data: newClient } = await adminClient
      .from('client')
      .insert({ auth_user_id: user.id, provider, email: user.email! })
      .select('id')
      .single()
    client = newClient
  }

  if (!client) {
    return { error: '계정 생성에 실패했습니다. 다시 시도해주세요.' }
  }

  const { error } = await adminClient.from('service_order').insert({
    client_id: client.id,
    category: pkg.category,
    package_slug: pkg.slug,
    package_name: pkg.name,
    price: pkg.price,
    detail: detail?.trim() || null,
  })

  if (error) {
    return { error: '서비스 신청에 실패했습니다. 다시 시도해주세요.' }
  }

  redirect('/status?success=service_ordered')
}
