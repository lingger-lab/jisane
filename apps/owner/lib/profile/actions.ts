'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

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
