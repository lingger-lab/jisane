import 'server-only'

import { adminClient } from '../supabase/admin'
import type { Database } from '../database.types'

export type ProviderRow = Database['public']['Tables']['provider']['Row']

/** auth 사용자에 연결된 provider(파트너) 행 조회 — 없으면 null */
export async function getProviderByAuthUser(authUserId: string): Promise<ProviderRow | null> {
  const { data } = await adminClient
    .from('provider')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single()
  return (data as ProviderRow | null) ?? null
}

/**
 * 파트너 액션 공통 가드 — active 상태의 provider만 통과.
 * 반환값으로 분기 상태를 알려 호출 측(레이아웃/액션)이 적절한 화면으로 안내한다.
 * 클라이언트가 보낸 provider_id는 절대 신뢰하지 않는다 — 항상 세션에서 도출.
 */
export async function requireActiveProvider(
  authUserId: string
): Promise<
  | { ok: true; provider: ProviderRow }
  | { ok: false; reason: 'no_provider' | 'pending' | 'rejected' | 'suspended' }
> {
  const provider = await getProviderByAuthUser(authUserId)
  if (!provider) return { ok: false, reason: 'no_provider' }
  if (provider.status === 'active') return { ok: true, provider }
  return { ok: false, reason: provider.status as 'pending' | 'rejected' | 'suspended' }
}

/** 패키지 수정/삭제 전 소유권 검증 — service_package.provider_id 대조 */
export async function verifyPackageOwnership(
  providerId: string,
  packageId: string
): Promise<boolean> {
  const { data } = await adminClient
    .from('service_package')
    .select('id')
    .eq('id', packageId)
    .eq('provider_id', providerId)
    .single()
  return !!data
}
