'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import {
  getProviderByAuthUser,
  requireActiveProvider,
  verifyPackageOwnership,
} from '@jisane/shared/provider/auth'
import { applyPackageEdit } from '@jisane/shared/service-package/edit-review-gate'

interface ActionState {
  error?: string
}

async function getSessionUser() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** 전문가회원 등록 신청 — provider 행 생성 (pending, 관리자 승인 대기) */
export async function applyAsPartner(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getSessionUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const existing = await getProviderByAuthUser(user.id)
  if (existing) return { error: '이미 전문가회원 신청 이력이 있습니다.' }

  const name = (formData.get('name') as string | null)?.trim()
  const kind = formData.get('kind') as string | null
  const type = formData.get('type') as string | null
  const contact = (formData.get('contact') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim()
  const website = (formData.get('website') as string | null)?.trim()

  if (!name) return { error: '기관명(또는 성함)을 입력해주세요.' }
  if (kind !== 'company' && kind !== 'senior') return { error: '전문가회원 유형을 선택해주세요.' }
  const validTypes = ['consulting', 'legal', 'tax', 'accounting', 'insurance']
  if (!type || !validTypes.includes(type)) return { error: '전문 분야를 선택해주세요.' }

  const authProvider = (user.app_metadata?.provider as string) || 'google'

  const { error } = await adminClient.from('provider').insert({
    name,
    kind: kind as 'company' | 'senior',
    type: type as 'consulting' | 'legal' | 'tax' | 'accounting' | 'insurance',
    auth_user_id: user.id,
    provider: authProvider === 'kakao' ? 'kakao' : 'google',
    email: user.email ?? null,
    contact: contact || null,
    description: description || null,
    website: website || null,
    status: 'pending',
  })

  if (error) {
    console.error('[applyAsPartner] insert failed:', error.message)
    return { error: '전문가회원 신청에 실패했습니다. 다시 시도해주세요.' }
  }

  redirect('/partner/apply?submitted=1')
}

/** 전문가회원 정보 수정 (active만) */
export async function updateProviderProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getSessionUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const guard = await requireActiveProvider(user.id)
  if (!guard.ok) return { error: '활동 중인 전문가회원만 정보를 수정할 수 있습니다.' }

  const name = (formData.get('name') as string | null)?.trim()
  if (!name) return { error: '기관명(또는 성함)을 입력해주세요.' }

  const { error } = await adminClient
    .from('provider')
    .update({
      name,
      contact: (formData.get('contact') as string | null)?.trim() || null,
      description: (formData.get('description') as string | null)?.trim() || null,
      website: (formData.get('website') as string | null)?.trim() || null,
    })
    .eq('id', guard.provider.id)

  if (error) return { error: '저장에 실패했습니다. 다시 시도해주세요.' }

  revalidatePath('/partner/dashboard/profile')
  redirect('/partner/dashboard/profile?success=saved')
}

/** slug 자동 생성: 영문 소문자·숫자·하이픈, 충돌 시 랜덤 suffix */
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/[가-힣]/g, '') // 한글은 slug에서 제외 (영문 있으면 사용)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base || 'service'
}

/** 서비스 등록 — draft로 생성, 관리자 검수 후 publish */
export async function createServicePackage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getSessionUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const guard = await requireActiveProvider(user.id)
  if (!guard.ok) return { error: '활동 중인 전문가회원만 서비스를 등록할 수 있습니다.' }

  const name = (formData.get('name') as string | null)?.trim()
  const category = formData.get('category') as string | null
  const targetAudience = formData.get('target_audience') as string | null
  const description = (formData.get('description') as string | null)?.trim()
  const valueDesc = (formData.get('value_desc') as string | null)?.trim()
  const priceRaw = formData.get('price') as string | null
  const isFree = formData.get('is_free') === 'on'
  const duration = (formData.get('duration') as string | null)?.trim()
  const deliverablesRaw = (formData.get('deliverables') as string | null)?.trim()

  if (!name) return { error: '서비스명을 입력해주세요.' }
  if (!category || !['ax_consulting', 'biz_consulting', 'education'].includes(category)) {
    return { error: '카테고리를 선택해주세요.' }
  }
  if (targetAudience !== 'owner' && targetAudience !== 'expert') {
    return { error: '제공 대상을 선택해주세요.' }
  }
  if (!description) return { error: '서비스 설명을 입력해주세요.' }

  const price = isFree ? 0 : parseInt((priceRaw || '').replace(/[^0-9]/g, ''), 10)
  if (!isFree && (!Number.isFinite(price) || price <= 0)) {
    return { error: '가격을 입력하거나 무료로 지정해주세요.' }
  }

  const deliverables = (deliverablesRaw || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  // slug 충돌 시 랜덤 suffix 재시도 (생성 후 불변 정책)
  const slug = slugify(name)
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = attempt === 0 ? slug : `${slug}-${Math.random().toString(36).slice(2, 7)}`
    const { error } = await adminClient.from('service_package').insert({
      provider_id: guard.provider.id,
      slug: candidate,
      category: category as 'ax_consulting' | 'biz_consulting' | 'education',
      name,
      description,
      price,
      is_free: isFree,
      deliverables,
      duration: duration || null,
      target_audience: targetAudience,
      value_desc: valueDesc || '',
      status: 'draft',
    })
    if (!error) {
      revalidatePath('/partner/dashboard/services')
      redirect('/partner/dashboard/services?success=created')
    }
    if (error.code !== '23505') {
      console.error('[createServicePackage] insert failed:', error.message)
      return { error: '서비스 등록에 실패했습니다. 다시 시도해주세요.' }
    }
  }
  return { error: '서비스 등록에 실패했습니다(이름 중복). 서비스명을 바꿔 다시 시도해주세요.' }
}

/**
 * 서비스 수정 (본인 소유만, slug 불변)
 * published 패키지 편집은 draft(비공개·검수 대기)로 회귀 — 관리자 재검수 후 재공개 (P2-15).
 */
export async function updateServicePackage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getSessionUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const guard = await requireActiveProvider(user.id)
  if (!guard.ok) return { error: '활동 중인 전문가회원만 수정할 수 있습니다.' }

  const packageId = formData.get('package_id') as string | null
  if (!packageId) return { error: '접근 권한이 없습니다.' }

  const name = (formData.get('name') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim()
  if (!name || !description) return { error: '서비스명과 설명을 입력해주세요.' }

  const isFree = formData.get('is_free') === 'on'
  const price = isFree
    ? 0
    : parseInt(((formData.get('price') as string | null) || '').replace(/[^0-9]/g, ''), 10)
  if (!isFree && (!Number.isFinite(price) || price <= 0)) {
    return { error: '가격을 입력하거나 무료로 지정해주세요.' }
  }

  const deliverables = ((formData.get('deliverables') as string | null) || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  // 소유권 검증 + published→draft 재검수 회귀 + CAS는 applyPackageEdit이 수행
  const result = await applyPackageEdit(adminClient, {
    packageId,
    providerId: guard.provider.id,
    fields: {
      name,
      description,
      price,
      is_free: isFree,
      deliverables,
      duration: (formData.get('duration') as string | null)?.trim() || null,
      value_desc: (formData.get('value_desc') as string | null)?.trim() || '',
    },
  })

  if (!result.ok) {
    if (result.reason === 'not_found') return { error: '접근 권한이 없습니다.' }
    if (result.reason === 'conflict') {
      return { error: '저장 중 서비스 상태가 변경되었습니다. 새로고침 후 다시 시도해주세요.' }
    }
    return { error: '저장에 실패했습니다. 다시 시도해주세요.' }
  }

  revalidatePath('/partner/dashboard/services')
  redirect('/partner/dashboard/services?success=saved')
}

/** 서비스 보관 (노출 중단) */
export async function archiveServicePackage(packageId: string): Promise<ActionState> {
  const user = await getSessionUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const guard = await requireActiveProvider(user.id)
  if (!guard.ok) return { error: '접근 권한이 없습니다.' }

  if (!(await verifyPackageOwnership(guard.provider.id, packageId))) {
    return { error: '접근 권한이 없습니다.' }
  }

  const { error } = await adminClient
    .from('service_package')
    .update({ status: 'archived' })
    .eq('id', packageId)
    .eq('provider_id', guard.provider.id)

  if (error) return { error: '보관 처리에 실패했습니다.' }

  revalidatePath('/partner/dashboard/services')
  return {}
}

/** 주문 완료 처리 — 전문가회원 권한은 processing → completed 전환만 */
export async function completeOrder(orderId: string): Promise<ActionState> {
  const user = await getSessionUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const guard = await requireActiveProvider(user.id)
  if (!guard.ok) return { error: '접근 권한이 없습니다.' }

  const { data: order } = await adminClient
    .from('service_order')
    .select('id, status, provider_id')
    .eq('id', orderId)
    .single()

  if (!order || order.provider_id !== guard.provider.id) {
    return { error: '접근 권한이 없습니다.' }
  }

  if (order.status !== 'processing') {
    return { error: '진행 중인 주문만 완료 처리할 수 있습니다.' }
  }

  const { error } = await adminClient
    .from('service_order')
    .update({ status: 'completed' })
    .eq('id', orderId)
    .eq('status', 'processing')

  if (error) return { error: '완료 처리에 실패했습니다.' }

  revalidatePath('/partner/dashboard/orders')
  return {}
}

/** 서비스 주문 메시지 — 전문가회원(공급자). service_order.provider_id 소유검증 후 저장. */
export async function sendServiceOrderMessage(
  orderId: string,
  content: string
): Promise<ActionState> {
  const user = await getSessionUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const guard = await requireActiveProvider(user.id)
  if (!guard.ok) return { error: '접근 권한이 없습니다.' }

  if (!content.trim()) return { error: '메시지를 입력해주세요.' }
  if (content.length > 1000) return { error: '메시지는 1000자 이내로 입력해주세요.' }

  const { data: order } = await adminClient
    .from('service_order')
    .select('id, provider_id')
    .eq('id', orderId)
    .single()

  if (!order || order.provider_id !== guard.provider.id) return { error: '접근 권한이 없습니다.' }

  const { error } = await adminClient.from('service_order_message').insert({
    service_order_id: orderId,
    sender_type: 'provider',
    sender_id: guard.provider.id,
    content: content.trim(),
  })

  if (error) {
    console.error('[partner/actions] sendServiceOrderMessage 저장 실패:', error.message)
    return { error: '메시지 전송에 실패했습니다.' }
  }

  revalidatePath(`/partner/dashboard/orders/${orderId}`)
  return {}
}
