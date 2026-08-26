import { adminClient } from '@jisane/shared/supabase/admin'
import type { RoleHolding, MemberRole } from './member-detail'

/** 같은 auth 계정이 보유한 owner/expert/provider 역할 현황(각 UNIQUE(auth_user_id)이라 최대 1행). */
export async function getRoleHoldings(authUserId: string | null): Promise<RoleHolding[]> {
  const roles: MemberRole[] = ['owner', 'expert', 'provider']
  if (!authUserId) return roles.map((role) => ({ role, id: null, status: null }))

  return Promise.all(
    roles.map(async (role) => {
      const { data } = await adminClient.from(role).select('id, status').eq('auth_user_id', authUserId).maybeSingle()
      return { role, id: data?.id ?? null, status: data?.status ?? null }
    }),
  )
}
