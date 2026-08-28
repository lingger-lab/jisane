import 'server-only'

import { adminClient } from '../supabase/admin'
import { PLATFORM_PROVIDER_IDS } from '../service-catalog'
import type { ServicePackage, ProviderInfo } from '../service-catalog'

/**
 * 전문서비스 카탈로그 DB 조회 — 하드코딩 SERVICE_PACKAGES 대체.
 * 반환 타입은 기존 ServicePackage/ProviderInfo 인터페이스 모양 그대로 유지해
 * UI 컴포넌트 prop 타입을 바꾸지 않는다. published 패키지만 노출한다.
 */

interface PackageRowWithProvider {
  id: string
  slug: string
  category: ServicePackage['category']
  pillar: ServicePackage['pillar'] | null
  name: string
  description: string
  price: number
  is_free: boolean
  deliverables: string[]
  duration: string | null
  target_audience: ServicePackage['targetAudience']
  featured: boolean
  value_desc: string
  ax_dashboard_url: string | null
  banner_url: string | null
  provider_id: string
  provider: { name: string }
}

function toServicePackage(row: PackageRowWithProvider): ServicePackage {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    pillar: row.pillar ?? undefined,
    name: row.name,
    description: row.description,
    price: row.price,
    deliverables: row.deliverables,
    duration: row.duration ?? undefined,
    axDashboardUrl: row.ax_dashboard_url ?? undefined,
    targetAudience: row.target_audience,
    featured: row.featured || undefined,
    provider: row.provider.name,
    providerId: row.provider_id,
    valueDesc: row.value_desc,
    isFree: row.is_free,
    bannerUrl: row.banner_url ?? undefined,
    isOfficial: PLATFORM_PROVIDER_IDS.includes(row.provider_id) || undefined,
  }
}

const PACKAGE_SELECT =
  'id, slug, category, pillar, name, description, price, is_free, deliverables, duration, target_audience, featured, value_desc, ax_dashboard_url, banner_url, provider_id, provider:provider!inner(name)'

export async function getPackagesByAudience(
  audience: ServicePackage['targetAudience']
): Promise<ServicePackage[]> {
  const { data, error } = await adminClient
    .from('service_package')
    .select(PACKAGE_SELECT)
    .eq('target_audience', audience)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[service-package] getPackagesByAudience failed:', error.message)
    return []
  }
  return (data as unknown as PackageRowWithProvider[]).map(toServicePackage)
}

export async function getPackageBySlug(slug: string): Promise<ServicePackage | null> {
  const { data, error } = await adminClient
    .from('service_package')
    .select(PACKAGE_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return null
  return toServicePackage(data as unknown as PackageRowWithProvider)
}

/** 대상 audience별 제공기관 목록 (패키지 수·무료 수 집계) */
export async function getProvidersByAudience(
  audience: ServicePackage['targetAudience']
): Promise<ProviderInfo[]> {
  const packages = await getPackagesByAudience(audience)
  const map = new Map<string, ProviderInfo>()
  for (const pkg of packages) {
    const existing = map.get(pkg.providerId)
    if (existing) {
      existing.packageCount++
      if (pkg.isFree) existing.freeCount++
    } else {
      map.set(pkg.providerId, {
        id: pkg.providerId,
        name: pkg.provider,
        packageCount: 1,
        freeCount: pkg.isFree ? 1 : 0,
      })
    }
  }
  return Array.from(map.values())
}
