'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

interface CreateInvitationState {
  error?: string
}

export async function createInvitation(
  _prev: CreateInvitationState,
  formData: FormData
): Promise<CreateInvitationState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const expertId = formData.get('expert_id') as string | null
  if (!expertId) {
    return { error: '전문가 정보가 없습니다.' }
  }

  // owner 조회 (없으면 자동 생성)
  let { data: owner } = await adminClient
    .from('owner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!owner) {
    const provider = (user.app_metadata?.provider as string) || 'google'
    const { data: newOwner } = await adminClient
      .from('owner')
      .insert({ auth_user_id: user.id, provider, email: user.email! })
      .select('id')
      .single()
    owner = newOwner
  }

  if (!owner) {
    return { error: '계정 생성에 실패했습니다.' }
  }

  // 전문가 존재 + 활성 확인
  const { data: expert } = await adminClient
    .from('expert')
    .select('id, status')
    .eq('id', expertId)
    .single()

  if (!expert || expert.status !== 'active') {
    return { error: '활동 중인 전문가가 아닙니다.' }
  }

  // 5건 제한 (platform_config 기반)
  const { data: config } = await adminClient
    .from('platform_config')
    .select('value')
    .eq('key', 'max_active_invitations')
    .single()

  const maxInvitations = config?.value ? Number(config.value) : 5

  const { count } = await adminClient
    .from('invitation')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', owner.id)
    .eq('status', 'invited')

  if ((count ?? 0) >= maxInvitations) {
    return { error: `초빙은 최대 ${maxInvitations}건까지 가능합니다. 기존 초빙이 처리된 후 다시 시도해주세요.` }
  }

  // 이미 같은 전문가에게 대기 중인 초빙이 있는지 확인
  const { count: dupCount } = await adminClient
    .from('invitation')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', owner.id)
    .eq('expert_id', expertId)
    .eq('status', 'invited')

  if ((dupCount ?? 0) > 0) {
    return { error: '이미 이 전문가에게 초빙을 보냈습니다.' }
  }

  // 초빙 생성
  const { error } = await adminClient.from('invitation').insert({
    owner_id: owner.id,
    expert_id: expertId,
  })

  if (error) {
    return { error: '초빙 요청에 실패했습니다. 다시 시도해주세요.' }
  }

  redirect(`/experts/${expertId}?success=invitation_sent`)
}
