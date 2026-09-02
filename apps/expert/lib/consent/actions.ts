'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { grantMarketingConsent, withdrawMarketingConsent } from '@jisane/shared/consent/consent'
import { normalizePhone } from '@jisane/shared/consultation/validate'

/** 마이페이지 마케팅 수신 토글 — 시니어지식인. 연락처(휴대폰)를 키로 consent_log에 기록. */
export async function setMarketingConsent(next: boolean): Promise<{ ok?: boolean; error?: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: expert } = await adminClient
    .from('expert')
    .select('id, contact')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!expert) return { error: '회원 정보를 찾을 수 없습니다.' }

  const phone = normalizePhone(expert.contact as string | null)
  if (!phone) return { error: '휴대폰 번호를 먼저 등록해주세요.' }

  const args = { phone, expertId: expert.id as string, source: 'mypage' as const }
  const r = next ? await grantMarketingConsent(args) : await withdrawMarketingConsent(args)
  if (!r.ok) return { error: '설정 저장에 실패했습니다.' }
  revalidatePath('/mypage')
  return { ok: true }
}
