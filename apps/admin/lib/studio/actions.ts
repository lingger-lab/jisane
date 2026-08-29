'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { issueBannerUploadUrl, isOwnBannerUrl } from '@jisane/shared/service-package/banner'
import { ENTERLABS_ID, JISANE_OFFICIAL_ID, PLATFORM_PROVIDER_IDS } from '@jisane/shared/service-catalog'

/** 배너 경로 검증 — 플랫폼(엔터랩스↔지사네 재배정) provider면 두 경로 모두 허용, 회원은 본인 경로만. */
function isValidStudioBanner(url: string | null, providerId: string): boolean {
  if (PLATFORM_PROVIDER_IDS.includes(providerId)) {
    return isOwnBannerUrl(url, ENTERLABS_ID) || isOwnBannerUrl(url, JISANE_OFFICIAL_ID)
  }
  return isOwnBannerUrl(url, providerId)
}

/**
 * 관리자 지식서비스 스튜디오 — 지사네 자체 등록 + 회원 대리등록.
 * 정책: 관리자=검수 주체이므로 즉시 published 허용(재검수 게이트 미경유). 회원 승인관계 무관하게
 * 임의 provider(pending 포함)로 대리등록 가능. 엔터랩스(5대 기업전문서비스)는 별도 면이라 제외.
 */

interface ActionState {
  error?: string
}

const LIST_PATH = '/dashboard/knowledge-studio'
const VALID_STATUS = ['draft', 'published', 'archived']

async function isAdmin(): Promise<boolean> {
  try {
    await verifyAdmin()
    return true
  } catch {
    return false
  }
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/[가-힣]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base || 'service'
}

interface ParsedFields {
  name: string
  category: 'ax_consulting' | 'biz_consulting' | 'education'
  target_audience: 'owner' | 'expert'
  description: string
  value_desc: string
  price: number
  is_free: boolean
  duration: string | null
  deliverables: string[]
  banner_url: string | null
}

function parseForm(formData: FormData): { fields: ParsedFields } | { error: string } {
  const name = (formData.get('name') as string | null)?.trim()
  const category = formData.get('category') as string | null
  const targetAudience = formData.get('target_audience') as string | null
  const description = (formData.get('description') as string | null)?.trim()
  const valueDesc = (formData.get('value_desc') as string | null)?.trim()
  const isFree = formData.get('is_free') === 'on'
  const priceTbd = formData.get('price_tbd') === 'on'
  const priceRaw = formData.get('price') as string | null
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

  // 가격 3분기: 무료 / 상담문의(price_tbd) / 유료
  let price = 0
  if (!isFree && !priceTbd) {
    price = parseInt((priceRaw || '').replace(/[^0-9]/g, ''), 10)
    if (!Number.isFinite(price) || price <= 0) {
      return { error: '가격을 입력하거나 무료/상담문의로 지정해주세요.' }
    }
  }

  const deliverables = (deliverablesRaw || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    fields: {
      name,
      category: category as ParsedFields['category'],
      target_audience: targetAudience,
      description,
      value_desc: valueDesc || '',
      price,
      is_free: isFree,
      duration: duration || null,
      deliverables,
      banner_url: (formData.get('banner_url') as string | null)?.trim() || null,
    },
  }
}

/** 대상 provider 검증 — 실존·비탈퇴·엔터랩스 아님. status는 무관(승인 전 대리등록 허용). */
async function resolveTargetProvider(providerId: string | null): Promise<{ id: string } | { error: string }> {
  if (!providerId) return { error: '제공자를 선택해주세요.' }
  if (providerId === ENTERLABS_ID) {
    return { error: '엔터랩스 5대 기업전문서비스는 [기업 전문서비스] 관리에서 등록합니다.' }
  }
  const { data, error } = await adminClient
    .from('provider')
    .select('id, status')
    .eq('id', providerId)
    .maybeSingle()
  if (error) return { error: '제공자 확인에 실패했습니다.' }
  if (!data) return { error: '존재하지 않는 제공자입니다.' }
  if (data.status === 'withdrawn') return { error: '탈퇴한 제공자에는 등록할 수 없습니다.' }
  return { id: data.id }
}

export async function createServiceFor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { error: '접근 권한이 없습니다.' }

  const providerResult = await resolveTargetProvider(formData.get('provider_id') as string | null)
  if ('error' in providerResult) return { error: providerResult.error }
  const providerId = providerResult.id

  const parsed = parseForm(formData)
  if ('error' in parsed) return { error: parsed.error }

  if (!isValidStudioBanner(parsed.fields.banner_url, providerId)) {
    return { error: '배너 이미지가 올바르지 않습니다(제공자 경로 불일치).' }
  }

  const status = (formData.get('status') as string | null) || 'published'
  if (!VALID_STATUS.includes(status)) return { error: '상태값이 올바르지 않습니다.' }

  const slug = slugify(parsed.fields.name)
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = attempt === 0 ? slug : `${slug}-${Math.random().toString(36).slice(2, 7)}`
    const { error } = await adminClient.from('service_package').insert({
      provider_id: providerId,
      slug: candidate,
      ...parsed.fields,
      status,
    })
    if (!error) {
      revalidatePath(LIST_PATH)
      redirect(`${LIST_PATH}?success=created`)
    }
    if (error.code !== '23505') {
      console.error('[studio createServiceFor] insert failed:', error.message)
      return { error: '등록에 실패했습니다. 다시 시도해주세요.' }
    }
  }
  return { error: '등록에 실패했습니다(이름 중복). 서비스명을 바꿔주세요.' }
}

export async function updateServiceFor(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { error: '접근 권한이 없습니다.' }

  const packageId = formData.get('package_id') as string | null
  const providerId = formData.get('provider_id') as string | null
  if (!packageId || !providerId) return { error: '잘못된 요청입니다.' }
  if (providerId === ENTERLABS_ID) return { error: '엔터랩스 서비스는 이 화면에서 수정할 수 없습니다.' }

  const parsed = parseForm(formData)
  if ('error' in parsed) return { error: parsed.error }
  if (!isValidStudioBanner(parsed.fields.banner_url, providerId)) {
    return { error: '배너 이미지가 올바르지 않습니다(제공자 경로 불일치).' }
  }

  const status = (formData.get('status') as string | null) || 'published'
  if (!VALID_STATUS.includes(status)) return { error: '상태값이 올바르지 않습니다.' }

  // 관리자=검수 주체 → 재검수 게이트 미경유(즉시 반영). slug·category·audience는 폼에서 변경 가능(관리자 권한).
  const { error } = await adminClient
    .from('service_package')
    .update({ ...parsed.fields, status })
    .eq('id', packageId)
    .eq('provider_id', providerId)
  if (error) {
    console.error('[studio updateServiceFor] update failed:', error.message)
    return { error: '저장에 실패했습니다. 다시 시도해주세요.' }
  }
  revalidatePath(LIST_PATH)
  redirect(`${LIST_PATH}?success=saved`)
}

/** 배너 업로드 URL 발급 — 관리자가 지정한 provider 경로로. */
export async function requestBannerUploadFor(providerId: string) {
  if (!(await isAdmin())) return null
  if (!providerId || providerId === ENTERLABS_ID) return null
  return issueBannerUploadUrl(providerId)
}

/** 계정 미연결 회원 지원 — 관리자가 provider 행을 대신 생성(당사자 OAuth 후 email 매칭으로 자동 연결). */
export async function createStudioProvider(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { error: '접근 권한이 없습니다.' }

  const name = (formData.get('name') as string | null)?.trim()
  const email = (formData.get('email') as string | null)?.trim() || null
  const kind = formData.get('kind') as string | null
  const type = formData.get('type') as string | null
  if (!name) return { error: '제공자명을 입력해주세요.' }
  if (kind !== 'company' && kind !== 'senior') return { error: '제공자 유형을 선택해주세요.' }
  if (!type || !['consulting', 'legal', 'tax', 'accounting', 'insurance'].includes(type)) {
    return { error: '지원 분야를 선택해주세요.' }
  }

  // 당사자 OAuth 후 applyAsPartner가 email 매칭으로 이 행을 연결 → active 부여(관리자 생성이므로)
  const { error } = await adminClient.from('provider').insert({
    name,
    email,
    kind,
    type,
    status: 'active',
    auth_user_id: null,
  })
  if (error) {
    console.error('[studio createStudioProvider] insert failed:', error.message)
    return { error: '제공자 생성에 실패했습니다.' }
  }
  revalidatePath(LIST_PATH)
  redirect(`${LIST_PATH}?success=provider_created`)
}
