'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

interface ProfileState {
  error?: string
}

export async function updatePartnerProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const field = formData.get('field') as string | null
  const careerYrsRaw = formData.get('career_yrs') as string | null
  const careerYrs = careerYrsRaw ? parseInt(careerYrsRaw, 10) : null
  const name = formData.get('name') as string | null
  const contact = formData.get('contact') as string | null

  if (!field || !field.trim()) {
    return { error: '전문 분야를 선택해주세요.' }
  }

  const { data: partner } = await adminClient
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner) {
    return { error: '파트너 계정 정보를 찾을 수 없습니다.' }
  }

  const { error } = await adminClient
    .from('partner')
    .update({
      field: field.trim(),
      career_yrs: careerYrs,
      name: name?.trim() || null,
      contact: contact?.trim() || null,
    })
    .eq('id', partner.id)

  if (error) {
    return { error: '프로필 등록에 실패했습니다. 다시 시도해주세요.' }
  }

  redirect('/matching')
}
