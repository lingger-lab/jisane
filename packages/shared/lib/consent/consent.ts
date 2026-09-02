import 'server-only'
import { adminClient } from '../supabase/admin'
import { CONSENT_VERSION } from '../consultation/validate'

/**
 * 동의 원장(consent_log) 조회·기록 — 서버 전용(service-role). 마케팅 세그먼트는
 * phone별 marketing_kakao 최신 action이 'granted'인 집합으로 계산한다(원장이 곧 현재 상태).
 */

export interface ConsentContact {
  phone: string
  ownerId: string | null
  expertId: string | null
}

interface ConsentRow {
  phone: string
  action: 'granted' | 'withdrawn'
  owner_id: string | null
  expert_id: string | null
  created_at: string
}

/** phone별 최신 marketing_kakao action이 granted인 연락처. (최신순 dedupe) */
export async function getMarketingConsentedContacts(): Promise<ConsentContact[]> {
  const { data, error } = await adminClient
    .from('consent_log')
    .select('phone, action, owner_id, expert_id, created_at')
    .eq('item', 'marketing_kakao')
    .order('created_at', { ascending: false })
    .limit(5000)
  if (error || !data) return []
  const seen = new Set<string>()
  const out: ConsentContact[] = []
  for (const r of data as ConsentRow[]) {
    if (seen.has(r.phone)) continue // 이미 최신 레코드를 봤음
    seen.add(r.phone)
    if (r.action === 'granted') {
      out.push({ phone: r.phone, ownerId: r.owner_id, expertId: r.expert_id })
    }
  }
  return out
}

export async function getMarketingConsentCount(): Promise<number> {
  return (await getMarketingConsentedContacts()).length
}

/** 특정 phone의 마케팅 수신 현재 상태(true=수신동의). 최신 레코드 기준. */
export async function getMarketingConsentState(phone: string): Promise<boolean> {
  const { data } = await adminClient
    .from('consent_log')
    .select('action')
    .eq('item', 'marketing_kakao')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
  return (data?.[0]?.action as string | undefined) === 'granted'
}

interface WriteConsentArgs {
  phone: string
  ownerId?: string | null
  expertId?: string | null
  source: 'inquiry_form' | 'mypage' | 'unsubscribe_link' | 'admin'
}

async function writeConsent(action: 'granted' | 'withdrawn', args: WriteConsentArgs): Promise<{ ok: boolean }> {
  const { error } = await adminClient.from('consent_log').insert({
    phone: args.phone,
    owner_id: args.ownerId ?? null,
    expert_id: args.expertId ?? null,
    item: 'marketing_kakao',
    action,
    version: CONSENT_VERSION,
    source: args.source,
  })
  if (error) {
    console.error('[consent] write failed:', error.message)
    return { ok: false }
  }
  return { ok: true }
}

export function grantMarketingConsent(args: WriteConsentArgs) {
  return writeConsent('granted', args)
}
export function withdrawMarketingConsent(args: WriteConsentArgs) {
  return writeConsent('withdrawn', args)
}
