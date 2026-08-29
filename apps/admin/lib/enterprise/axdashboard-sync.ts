import { createClient } from '@supabase/supabase-js'
import { JISANE_OFFICIAL_ID, type EnterprisePillar } from '@jisane/shared/service-catalog'
import { classifyPillar } from './classify-pillar'

/**
 * axdashboard(자산허브/앱스킬) → jisane 지식서비스 동기화 순수 로직.
 * 'use server'를 두지 않아 vitest가 mapSkillToPackage를 그대로 import해 단위테스트할 수 있다.
 * 크로스프로젝트 클라이언트는 anon 키만 사용(공개 허브 뷰 skills_hub만 읽음).
 */

/** axdashboard skills_hub 뷰 한 행(0006_skills_hub_view.sql와 1:1). */
export interface SkillHubRow {
  id: string
  slug: string
  title: string
  short_description: string | null
  description: string | null
  features: string[] | null
  thumbnail_url: string | null
  price_mode: string | null
  original_price: number | null
  sale_price: number | null
  is_featured: boolean | null
  display_order: number | null
  category_slug: string | null
}

/** 동기화 스킬의 소속 provider — 지사네 공식(엔터랩스 아님). 카드에 "지사네"·"지사네 공식" 표시. */
export const SYNC_PROVIDER_ID = JISANE_OFFICIAL_ID

/**
 * service_package로 upsert할 필드. pillar는 classifyPillar로 **자동분류해 포함**(재동기화 재분류).
 * **visible은 절대 포함하지 않는다**(관리자 노출 설정 보존).
 */
export interface SyncPackageFields {
  provider_id: string
  slug: string
  name: string
  value_desc: string
  description: string
  deliverables: string[]
  banner_url: string | null
  price: number
  is_free: boolean
  featured: boolean
  sort_order: number
  category: 'ax_consulting' | 'biz_consulting' | 'education'
  pillar: EnterprisePillar
  target_audience: 'owner'
  status: 'published'
  source_ref: string
}

/** axdashboard 카테고리 slug → jisane 3값 category. 실제 5대 매칭(pillar)은 관리자가 별도 지정. */
const AXD_CATEGORY_MAP: Record<string, SyncPackageFields['category']> = {
  'gov-rnd': 'biz_consulting',
  'strategy-planning': 'biz_consulting',
  'startup-item': 'biz_consulting',
  'content-marketing': 'education',
  'lecture-general': 'education',
  // data-analysis · ai-automation · dev-tools · election-politics · (null) → 기본 ax_consulting
}

function categoryForSlug(slug: string | null): SyncPackageFields['category'] {
  return (slug && AXD_CATEGORY_MAP[slug]) || 'ax_consulting'
}

/** 가격 3분기: fixed&sale>0 유료 / fixed&sale=0 무료 / consult·미정 상담문의(price0·is_free false). */
function priceFrom(row: SkillHubRow): { price: number; is_free: boolean } {
  if (row.price_mode === 'fixed' && row.sale_price != null && row.sale_price > 0) {
    return { price: row.sale_price, is_free: false }
  }
  if (row.price_mode === 'fixed' && row.sale_price === 0) {
    return { price: 0, is_free: true }
  }
  return { price: 0, is_free: false } // 상담 문의
}

/** 순수 매핑 — 단위테스트 대상. banner는 https 절대경로만(레거시 상대경로/http → null 폴백). */
export function mapSkillToPackage(row: SkillHubRow): SyncPackageFields {
  const banner = row.thumbnail_url && row.thumbnail_url.startsWith('https://') ? row.thumbnail_url : null
  const { price, is_free } = priceFrom(row)
  return {
    provider_id: SYNC_PROVIDER_ID,
    slug: row.slug,
    name: row.title,
    value_desc: row.short_description ?? '',
    description: row.description || row.short_description || row.title,
    deliverables: row.features ?? [],
    banner_url: banner,
    price,
    is_free,
    featured: row.is_featured ?? false,
    sort_order: row.display_order ?? 0,
    category: categoryForSlug(row.category_slug),
    pillar: classifyPillar(row.title, row.description, row.category_slug),
    target_audience: 'owner',
    status: 'published',
    source_ref: `axd:${row.id}`,
  }
}

export interface ExistingSlugRow {
  slug: string
  provider_id: string
  source_ref: string | null
}

/**
 * 충돌 가드(순수) — 같은 slug가 (회원 소유) 또는 (엔터랩스 seed·비axd)면 덮어쓰지 않고 skip.
 * 이전 동기화분(엔터랩스 + source_ref 'axd:')만 upsert 대상에 남긴다.
 */
export function partitionForUpsert(
  payloads: SyncPackageFields[],
  existing: ExistingSlugRow[],
): { toUpsert: SyncPackageFields[]; skipped: string[] } {
  const bySlug = new Map(existing.map((r) => [r.slug, r]))
  const skipped: string[] = []
  const toUpsert = payloads.filter((p) => {
    const ex = bySlug.get(p.slug)
    if (!ex) return true
    const isPriorSync =
      ex.provider_id === SYNC_PROVIDER_ID && typeof ex.source_ref === 'string' && ex.source_ref.startsWith('axd:')
    if (!isPriorSync) {
      skipped.push(p.slug)
      return false
    }
    return true
  })
  return { toUpsert, skipped }
}

/** prune 대상(순수) — 기존 axd 동기화 행 중 이번 수신 source_ref 집합에 없는 것의 id. */
export function selectStaleIds(
  existingAxd: { id: string; source_ref: string | null }[],
  incomingRefs: Set<string>,
): string[] {
  return existingAxd.filter((r) => r.source_ref && !incomingRefs.has(r.source_ref)).map((r) => r.id)
}

/** axdashboard anon 클라이언트 — env 미설정 시 null(호출처가 에러 처리). */
export function createAxdashboardClient() {
  const url = process.env.AXDASHBOARD_SUPABASE_URL
  const key = process.env.AXDASHBOARD_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}
