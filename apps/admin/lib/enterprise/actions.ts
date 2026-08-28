'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { issueBannerUploadUrl, isOwnBannerUrl } from '@jisane/shared/service-package/banner'
import { PILLAR_ORDER, PLATFORM_PROVIDER_IDS, type EnterprisePillar } from '@jisane/shared/service-catalog'
import {
  mapSkillToPackage,
  createAxdashboardClient,
  partitionForUpsert,
  selectStaleIds,
  SYNC_PROVIDER_ID,
  type SkillHubRow,
  type ExistingSlugRow,
} from './axdashboard-sync'

interface ActionState {
  error?: string
}

export type SyncResult =
  | { ok: true; upserted: number; archived: number; skipped: string[] }
  | { ok: false; error: string }

/** 엔터랩스 provider — 5대 기업전문서비스는 관리자가 이 provider로 직접 등록 */
const ENTERLABS_ID = 'd0000001-0000-0000-0000-000000000001'
const LIST_PATH = '/dashboard/enterprise-services'
const VALID_STATUS = ['draft', 'published', 'archived']

async function isAdmin(): Promise<boolean> {
  try {
    await verifyAdmin()
    return true
  } catch {
    return false
  }
}

/** slug 생성: 영문 소문자·숫자·하이픈(한글 제외), 비면 'service' */
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

/** pillar → category(3값 enum) 파생 — category는 NOT NULL이나 owner 기업서비스의 실제 분류축은 pillar */
function categoryForPillar(pillar: EnterprisePillar): 'ax_consulting' | 'biz_consulting' {
  return pillar === 'ai_ax' ? 'ax_consulting' : 'biz_consulting'
}

interface ParsedFields {
  name: string
  pillar: EnterprisePillar
  category: 'ax_consulting' | 'biz_consulting'
  description: string
  value_desc: string
  price: number
  is_free: boolean
  duration: string | null
  deliverables: string[]
  banner_url: string | null
}

/**
 * 폼 파싱(생성·수정 공용). 가격 3분기:
 * - 무료(is_free) → price 0, is_free true("무료")
 * - 가격 미정(price_tbd) → price 0, is_free false("상담 문의" sentinel)
 * - 유료 → price>0
 */
function parseForm(
  formData: FormData
): { ok: true; fields: ParsedFields; status: string } | { ok: false; error: string } {
  const name = (formData.get('name') as string | null)?.trim()
  const pillarRaw = formData.get('pillar') as string | null
  const description = (formData.get('description') as string | null)?.trim()
  const valueDesc = (formData.get('value_desc') as string | null)?.trim()
  const duration = (formData.get('duration') as string | null)?.trim()
  const deliverablesRaw = (formData.get('deliverables') as string | null)?.trim()
  const statusRaw = (formData.get('status') as string | null) ?? 'published'
  const isFree = formData.get('is_free') === 'on'
  const priceTbd = formData.get('price_tbd') === 'on'
  const priceRaw = formData.get('price') as string | null

  if (!name) return { ok: false, error: '서비스명을 입력해주세요.' }
  if (!pillarRaw || !PILLAR_ORDER.includes(pillarRaw as EnterprisePillar)) {
    return { ok: false, error: '분류(5대 지원)를 선택해주세요.' }
  }
  if (!description) return { ok: false, error: '서비스 설명을 입력해주세요.' }

  const pillar = pillarRaw as EnterprisePillar
  const status = VALID_STATUS.includes(statusRaw) ? statusRaw : 'published'

  let price = 0
  if (!isFree && !priceTbd) {
    price = parseInt((priceRaw || '').replace(/[^0-9]/g, ''), 10)
    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, error: '가격을 입력하거나, 무료 또는 가격 미정(상담 문의)을 선택해주세요.' }
    }
  }

  const deliverables = (deliverablesRaw || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    ok: true,
    status,
    fields: {
      name,
      pillar,
      category: categoryForPillar(pillar),
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

/** 기업 전문서비스 등록 — 엔터랩스·owner. status는 폼 선택(기본 published). */
export async function createEnterpriseService(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await isAdmin())) return { error: '관리자 권한이 필요합니다.' }

  const parsed = parseForm(formData)
  if (!parsed.ok) return { error: parsed.error }

  if (!isOwnBannerUrl(parsed.fields.banner_url, ENTERLABS_ID)) {
    return { error: '배너 이미지가 올바르지 않습니다(경로 불일치).' }
  }

  // slug: 관리자 입력 우선(정제), 없으면 이름 기반
  const custom = (formData.get('slug') as string | null)?.trim()
  const baseSlug = slugify(custom || parsed.fields.name)

  // sort_order = 현재 최댓값 + 1
  const { data: maxRow } = await adminClient
    .from('service_package')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const sortOrder = ((maxRow?.sort_order as number | undefined) ?? 0) + 1

  // slug 충돌 시 랜덤 suffix 재시도 (생성 후 slug 불변)
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`
    const { error } = await adminClient.from('service_package').insert({
      provider_id: ENTERLABS_ID,
      slug: candidate,
      target_audience: 'owner',
      status: parsed.status,
      sort_order: sortOrder,
      featured: false,
      ...parsed.fields,
    })
    if (!error) {
      revalidatePath(LIST_PATH)
      redirect(`${LIST_PATH}?success=created`)
    }
    if (error.code !== '23505') {
      console.error('[createEnterpriseService] insert failed:', error.message)
      return { error: '서비스 등록에 실패했습니다. 다시 시도해주세요.' }
    }
  }
  return { error: '서비스 등록에 실패했습니다(slug 중복). slug 또는 이름을 바꿔 다시 시도해주세요.' }
}

/** 기업 전문서비스 수정 — slug 불변, 나머지·status 편집(관리자 권한이라 재검수 게이트 없음). */
export async function updateEnterpriseService(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await isAdmin())) return { error: '관리자 권한이 필요합니다.' }

  const id = formData.get('package_id') as string | null
  if (!id) return { error: '대상을 찾을 수 없습니다.' }

  const parsed = parseForm(formData)
  if (!parsed.ok) return { error: parsed.error }

  if (!isOwnBannerUrl(parsed.fields.banner_url, ENTERLABS_ID)) {
    return { error: '배너 이미지가 올바르지 않습니다(경로 불일치).' }
  }

  const { error } = await adminClient
    .from('service_package')
    .update({ status: parsed.status, ...parsed.fields })
    .eq('id', id)
    .eq('provider_id', ENTERLABS_ID)

  if (error) {
    console.error('[updateEnterpriseService] update failed:', error.message)
    return { error: '저장에 실패했습니다. 다시 시도해주세요.' }
  }

  revalidatePath(LIST_PATH)
  redirect(`${LIST_PATH}?success=saved`)
}

/** 기업 전문서비스 보관 (오너 화면 노출 중단) */
export async function archiveEnterpriseService(id: string): Promise<ActionState> {
  if (!(await isAdmin())) return { error: '관리자 권한이 필요합니다.' }

  const { error } = await adminClient
    .from('service_package')
    .update({ status: 'archived' })
    .eq('id', id)
    .eq('provider_id', ENTERLABS_ID)

  if (error) return { error: '보관 처리에 실패했습니다.' }

  revalidatePath(LIST_PATH)
  return {}
}

/** 배너 업로드 URL 발급 — 엔터랩스 고정 경로(banners/{ENTERLABS_ID}/…). Storage 미구성 시 null. */
export async function requestEnterpriseBannerUpload() {
  if (!(await isAdmin())) return null
  return issueBannerUploadUrl(ENTERLABS_ID)
}

/**
 * axdashboard(자산허브/앱스킬) 스킬을 엔터랩스 지식서비스로 동기화(멱등).
 * 규칙: (1) 회원/엔터랩스 seed slug 충돌은 skip+보고(덮어쓰기 금지) (2) upsert는 pillar·visible을
 * 기입하지 않아 관리자 매칭·노출설정을 보존 (3) 이전 동기화분(axd:) 중 이번 수신에 없는 것은 archived.
 */
export async function syncEnterlabsSkills(): Promise<SyncResult> {
  if (!(await isAdmin())) return { ok: false, error: '관리자 권한이 필요합니다.' }

  const axd = createAxdashboardClient()
  if (!axd) return { ok: false, error: 'axdashboard 연결 설정(AXDASHBOARD_SUPABASE_URL/ANON_KEY)이 없습니다.' }

  const { data: skills, error: fetchErr } = await axd
    .from('skills_hub')
    .select('id, slug, title, short_description, description, features, thumbnail_url, price_mode, original_price, sale_price, is_featured, display_order, category_slug')
  if (fetchErr) {
    console.error('[syncEnterlabsSkills] skills_hub fetch failed:', fetchErr.message)
    return { ok: false, error: 'axdashboard 스킬 조회에 실패했습니다.' }
  }

  const payloads = (skills as SkillHubRow[]).map(mapSkillToPackage)
  if (payloads.length === 0) {
    // 수신 0건 — 뷰/권한 이상일 수 있어 prune(대량 archived)을 하지 않는다(안전).
    return { ok: true, upserted: 0, archived: 0, skipped: [] }
  }

  // 충돌 가드 — 같은 slug가 (회원 소유) 또는 (엔터랩스 seed·비axd)면 덮어쓰지 않고 skip
  const incomingSlugs = payloads.map((p) => p.slug)
  const { data: existing } = await adminClient
    .from('service_package')
    .select('slug, provider_id, source_ref')
    .in('slug', incomingSlugs)
  const { toUpsert, skipped } = partitionForUpsert(payloads, (existing ?? []) as ExistingSlugRow[])

  if (toUpsert.length > 0) {
    const { error: upErr } = await adminClient.from('service_package').upsert(toUpsert, { onConflict: 'slug' })
    if (upErr) {
      console.error('[syncEnterlabsSkills] upsert failed:', upErr.message)
      return { ok: false, error: '동기화 저장에 실패했습니다.' }
    }
  }

  // prune — 이전 동기화분(axd:) 중 이번 수신 source_ref에 없는 것은 archived(reversible)
  const incomingRefs = new Set(payloads.map((p) => p.source_ref))
  const { data: existingAxd } = await adminClient
    .from('service_package')
    .select('id, source_ref')
    .eq('provider_id', SYNC_PROVIDER_ID)
    .like('source_ref', 'axd:%')
    .neq('status', 'archived')
  const staleIds = selectStaleIds(
    (existingAxd ?? []) as { id: string; source_ref: string | null }[],
    incomingRefs,
  )
  let archived = 0
  if (staleIds.length > 0) {
    const { error: arErr } = await adminClient.from('service_package').update({ status: 'archived' }).in('id', staleIds)
    if (!arErr) archived = staleIds.length
  }

  revalidatePath(LIST_PATH)
  return { ok: true, upserted: toUpsert.length, archived, skipped }
}

/**
 * 노출 on/off — 오너 /services·공개 허브 노출 토글. **동기화가 보존하는 관리자 소유 컬럼**
 * (syncEnterlabsSkills는 visible을 기입하지 않으므로 off가 재동기화 후에도 유지된다).
 */
export async function setEnterpriseVisibility(id: string, visible: boolean): Promise<ActionState> {
  if (!(await isAdmin())) return { error: '관리자 권한이 필요합니다.' }

  const { error } = await adminClient
    .from('service_package')
    .update({ visible })
    .eq('id', id)
    .in('provider_id', PLATFORM_PROVIDER_IDS) // 엔터랩스 5대 + 지사네 동기화 공용

  if (error) return { error: '노출 설정에 실패했습니다.' }

  revalidatePath(LIST_PATH)
  return {}
}

/**
 * 5대 지원 pillar 매칭 — null이면 미매칭(오너 탭 미편입, 검색·허브만). pillar 지정 시 category도 파생.
 * 동기화가 보존하는 관리자 소유 컬럼(재동기화해도 매칭 유지).
 */
export async function setEnterprisePillar(id: string, pillar: EnterprisePillar | null): Promise<ActionState> {
  if (!(await isAdmin())) return { error: '관리자 권한이 필요합니다.' }
  if (pillar !== null && !PILLAR_ORDER.includes(pillar)) return { error: '분류값이 올바르지 않습니다.' }

  const patch: { pillar: EnterprisePillar | null; category?: 'ax_consulting' | 'biz_consulting' } = { pillar }
  if (pillar) patch.category = categoryForPillar(pillar)

  const { error } = await adminClient
    .from('service_package')
    .update(patch)
    .eq('id', id)
    .in('provider_id', PLATFORM_PROVIDER_IDS) // 엔터랩스 5대 + 지사네 동기화 공용

  if (error) return { error: '분류 매칭에 실패했습니다.' }

  revalidatePath(LIST_PATH)
  return {}
}
