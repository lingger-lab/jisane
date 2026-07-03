import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'
import { adminClient } from '../supabase/admin'
import type { DealWithOwnership } from '../query-types'

/**
 * 인증된 사용자의 auth_user_id를 반환합니다.
 * 미인증 시 루트('/')로 리다이렉트합니다.
 */
export async function getAuthUserId(): Promise<string> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }
  return user.id
}

/**
 * Admin 권한을 검증합니다.
 * ADMIN_EMAILS 환경변수에 포함된 이메일만 허용합니다.
 */
export async function verifyAdmin(): Promise<{ email: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    throw new Error('Unauthorized')
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())
  if (!adminEmails.includes(user.email.toLowerCase())) {
    throw new Error('Forbidden')
  }

  return { email: user.email }
}

/**
 * Deal 소유권을 검증합니다.
 * deal → request → client → auth_user_id 체인으로 확인합니다.
 */
export async function verifyDealOwnership(dealId: string, authUserId: string) {
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, status, request_id, request:request!inner(id, client_id, client:client!inner(auth_user_id))')
    .eq('id', dealId)
    .returns<DealWithOwnership[]>()
    .single()

  if (!deal) {
    return { error: '거래 정보를 찾을 수 없습니다.' as const }
  }

  const request = deal.request
  if (request.client.auth_user_id !== authUserId) {
    return { error: '접근 권한이 없습니다.' as const }
  }

  return { deal, requestId: request.id, clientId: request.client_id }
}
