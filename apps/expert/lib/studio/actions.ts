'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { ADMIN_URL } from '@/lib/urls'

/**
 * 지식서비스 스튜디오 진입 — 시니어지식인도 전문가파트너와 **동일 절차**:
 * 스튜디오에서 바로 등록(배너 포함) → 관리자 서비스 검수 → 공개.
 * provider 사전승인 단계를 두지 않는다. 이미 검증된 시니어에게 active senior provider를
 * 자동 보장(insert-if-missing / 재활성)한 뒤 스튜디오로 보낸다. 공개 승인은 서비스(draft→publish)에서만.
 * (회사 파트너 provider가 이미 있으면 그 벳팅 상태를 존중 — 손대지 않고 스튜디오 가드에 위임.)
 */
export async function enterKnowledgeStudio() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?error=login_required')

  const provider = await getProviderByAuthUser(user.id)

  if (!provider) {
    const { data: expert } = await adminClient
      .from('expert')
      .select('name, real_name, email, contact')
      .eq('auth_user_id', user.id)
      .single()
    await adminClient.from('provider').insert({
      auth_user_id: user.id,
      name: expert?.name || expert?.real_name || expert?.email || '시니어지식인',
      email: expert?.email ?? null,
      contact: expert?.contact ?? null,
      kind: 'senior',
      type: 'consulting',
      status: 'active',
    })
  } else if (provider.kind === 'senior' && provider.status !== 'active') {
    // 시니어는 사전승인 없이 활성화(공개 검수는 서비스 단계). 회사(company) provider는 손대지 않는다.
    await adminClient.from('provider').update({ status: 'active' }).eq('auth_user_id', user.id)
  }

  redirect(`${ADMIN_URL}/partner/dashboard`)
}
