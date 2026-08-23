'use server'

import { redirect } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { resolveExpertFromAuth } from '@jisane/shared/auth/server-helpers'
import { computeCareerScore } from '@jisane/shared/expert-scoring'

interface ProfileState {
  error?: string
}

export async function updateExpertProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const { user, expert } = await resolveExpertFromAuth()

  if (!user) {
    redirect('/')
  }

  const field = formData.get('field') as string | null
  const careerYearsRaw = formData.get('career_years') as string | null
  const careerYears = careerYearsRaw ? parseInt(careerYearsRaw, 10) : null
  const hourlyRateRaw = formData.get('hourly_rate') as string | null
  const hourlyRate = hourlyRateRaw ? parseInt(hourlyRateRaw, 10) : null
  const realName = formData.get('real_name') as string | null
  const name = formData.get('name') as string | null
  const contact = formData.get('contact') as string | null

  if (!field || !field.trim()) {
    return { error: '전문 분야를 선택해주세요.' }
  }

  // 실명은 필수 — 활동명(name)과 분리된 비공개 식별정보(관리자용). 값은 로그 금지(PII).
  if (!realName || !realName.trim()) {
    return { error: '실명을 입력해주세요.' }
  }

  if (hourlyRate !== null && (hourlyRate < 10000 || hourlyRate > 100000)) {
    return { error: '시간당 단가는 10,000원 ~ 100,000원 범위여야 합니다.' }
  }

  // expert row가 없으면 생성(insert-if-missing) — .jisane.cloud 공유세션으로 expert 콜백을
  // 건너뛴 사용자(예: 반려된 파트너가 시니어로 가입)도 /register가 항상 완료되도록.
  // 콜백과 동일한 email 가드(카카오 이메일 미동의 dead-end 방지).
  let expertId = expert?.id
  if (!expertId) {
    if (!user.email) {
      return { error: '이메일 제공에 동의한 계정으로 다시 로그인해주세요.' }
    }
    const authProvider = (user.app_metadata.provider as string) || 'google'
    const { data: created, error: insertErr } = await adminClient
      .from('expert')
      .insert({ auth_user_id: user.id, provider: authProvider, email: user.email })
      .select('id')
      .single()
    if (insertErr || !created) {
      // 유니크 경합 등 — 이미 있으면 재조회로 복구
      const { data: existing } = await adminClient
        .from('expert')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      if (!existing) {
        return { error: '시니어지식인 계정 생성에 실패했습니다. 다시 시도해주세요.' }
      }
      expertId = existing.id
    } else {
      expertId = created.id
    }
  }

  const { error } = await adminClient
    .from('expert')
    .update({
      field: field.trim(),
      career_years: careerYears,
      career_score: computeCareerScore(careerYears),
      hourly_rate: hourlyRate,
      real_name: realName.trim(),
      name: name?.trim() || null,
      contact: contact?.trim() || null,
    })
    .eq('id', expertId)

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

    // 기존 매핑은 항상 먼저 삭제(교체 의미) — 새 필드가 하나도 category와 매칭되지 않아도
    // stale 매핑이 남지 않도록. 가드 안에 두면 미매칭 시 옛 매핑이 잔존한다(감사 docs/11 P1-6 2차).
    const { error: delErr } = await adminClient
      .from('expert_category')
      .delete()
      .eq('expert_id', expertId)
    if (delErr) {
      console.error('[expert] expert_category delete failed:', delErr.message)
    }

    if (cats && cats.length > 0) {
      const { error: insErr } = await adminClient
        .from('expert_category')
        .insert(cats.map((c) => ({ expert_id: expertId, category_id: c.id })))
      // insert 실패는 삭제 후 매핑 공백을 남기므로 반드시 가시화(감사 docs/11 P2-29).
      // 원자성(delete+insert 트랜잭션)은 RPC 이관이 필요 — 별건(P1-17 계열).
      if (insErr) {
        console.error('[expert] expert_category insert failed:', insErr.message)
      }
    }
  }

  const redirectTo = (formData.get('redirect_to') as string) || '/matching'
  const successKey = redirectTo === '/mypage' ? 'profile_updated' : 'expert_registered'
  redirect(`${redirectTo}?success=${successKey}`)
}
