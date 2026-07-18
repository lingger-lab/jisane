'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { computeCareerScore } from '@jisane/shared/expert-scoring'

interface ProfileState {
  error?: string
}

export async function updateExpertProfile(
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
  const careerYearsRaw = formData.get('career_years') as string | null
  const careerYears = careerYearsRaw ? parseInt(careerYearsRaw, 10) : null
  const hourlyRateRaw = formData.get('hourly_rate') as string | null
  const hourlyRate = hourlyRateRaw ? parseInt(hourlyRateRaw, 10) : null
  const name = formData.get('name') as string | null
  const contact = formData.get('contact') as string | null

  if (!field || !field.trim()) {
    return { error: '전문 분야를 선택해주세요.' }
  }

  if (hourlyRate !== null && (hourlyRate < 10000 || hourlyRate > 100000)) {
    return { error: '시간당 단가는 10,000원 ~ 100,000원 범위여야 합니다.' }
  }

  const { data: expert } = await adminClient
    .from('expert')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!expert) {
    return { error: '전문가 계정 정보를 찾을 수 없습니다.' }
  }

  const { error } = await adminClient
    .from('expert')
    .update({
      field: field.trim(),
      career_years: careerYears,
      career_score: computeCareerScore(careerYears),
      hourly_rate: hourlyRate,
      name: name?.trim() || null,
      contact: contact?.trim() || null,
    })
    .eq('id', expert.id)

  if (error) {
    return { error: '프로필 등록에 실패했습니다. 다시 시도해주세요.' }
  }

  // expert_category 동기화 (중분류 label → category_id)
  const fieldLabels = field.trim().split(',').map((f) => f.trim()).filter(Boolean)
  if (fieldLabels.length > 0) {
    const { data: cats } = await adminClient
      .from('category')
      .select('id, label')
      .eq('depth', 1)
      .in('label', fieldLabels)

    if (cats && cats.length > 0) {
      // 기존 매핑 삭제 후 재삽입
      await adminClient
        .from('expert_category')
        .delete()
        .eq('expert_id', expert.id)

      await adminClient
        .from('expert_category')
        .insert(cats.map((c) => ({ expert_id: expert.id, category_id: c.id })))
    }
  }

  const redirectTo = (formData.get('redirect_to') as string) || '/matching'
  const successKey = redirectTo === '/mypage' ? 'profile_updated' : 'expert_registered'
  redirect(`${redirectTo}?success=${successKey}`)
}
