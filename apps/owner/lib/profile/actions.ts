'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { withdrawOwner } from '@jisane/shared/member/withdrawal'
import { signOut } from '@jisane/shared/auth/actions'

interface ActionState {
  error?: string
}

/** 기업회원 개인정보 수정 — 세션의 owner 본인 레코드만 (company·ceo_name·region·industry·contact) */
export async function updateOwnerProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: owner } = await adminClient
    .from('owner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!owner) return { error: '계정 정보를 찾을 수 없습니다.' }

  const company = (formData.get('company') as string | null)?.trim()
  if (!company) return { error: '회사명(또는 상호)을 입력해주세요.' }

  const { error } = await adminClient
    .from('owner')
    .update({
      company,
      ceo_name: (formData.get('ceo_name') as string | null)?.trim() || null,
      contact: (formData.get('contact') as string | null)?.trim() || null,
      region: (formData.get('region') as string | null)?.trim() || null,
      industry: (formData.get('industry') as string | null)?.trim() || null,
    })
    .eq('id', owner.id)

  if (error) return { error: '저장에 실패했습니다. 다시 시도해주세요.' }

  revalidatePath('/mypage')
  redirect('/mypage?success=profile_updated')
}

/**
 * 기업회원 본인 탈퇴(soft-delete) — 진행 중 거래가 없을 때만. 개인정보 익명화 후 로그아웃.
 * 다른 역할(시니어지식인/전문가)은 유지된다.
 */
export async function withdrawOwnerSelf(): Promise<ActionState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: owner } = await adminClient.from('owner').select('id').eq('auth_user_id', user.id).single()
  if (!owner) return { error: '계정 정보를 찾을 수 없습니다.' }

  // 진행 중 거래(quoted/working) 가드 — 의뢰의 딜 기준.
  const { data: reqs } = await adminClient.from('request').select('id').eq('owner_id', owner.id)
  const reqIds = (reqs ?? []).map((r) => r.id)
  if (reqIds.length > 0) {
    const { count } = await adminClient
      .from('deal')
      .select('id', { count: 'exact', head: true })
      .in('request_id', reqIds)
      .in('status', ['quoted', 'working'])
    if ((count ?? 0) > 0) {
      return { error: '진행 중인 거래가 있어 탈퇴할 수 없습니다. 거래를 완료한 뒤 다시 시도해주세요.' }
    }
  }

  const result = await withdrawOwner(owner.id, 'self')
  if (result.error) return { error: '탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.' }

  await signOut() // supabase 로그아웃 후 '/'로 리다이렉트 — 이 아래로는 도달하지 않음.
  return {}
}

/**
 * 탈퇴한 기업회원 재활성 — status만 active로 복구(익명화된 정보는 미복원, 회원이 재입력).
 * /rejoin 확인 페이지의 폼 액션.
 */
export async function reactivateOwnerSelf(): Promise<void> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: owner } = await adminClient.from('owner').select('id, status').eq('auth_user_id', user.id).single()
  if (owner && owner.status === 'withdrawn') {
    await adminClient
      .from('owner')
      .update({ status: 'active', withdrawn_at: null, withdrawn_by: null })
      .eq('id', owner.id)
  }
  redirect('/mypage?success=reactivated')
}
