import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { RegisterForm, type RegisterDefaults } from './register-form'

export const metadata = { title: '시니어지식인 등록 | 지사네' }

export default async function RegisterPage(props: { searchParams: Promise<{ rejoin?: string }> }) {
  const { rejoin } = await props.searchParams

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: expert } = await adminClient
    .from('expert')
    .select('status, field, career_years, hourly_rate, real_name, name, contact')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  // 이미 정보를 갖춘 활성 시니어지식인이면 재등록 폼(빈 폼) 대신 마이페이지로 —
  // 회원전환 링크로 진입한 기존 회원이 빈 폼 제출로 프로필을 리셋하던 문제 방지(감사 P2-3).
  if (expert && expert.status !== 'withdrawn' && expert.field) redirect('/mypage')

  // 탈퇴 계정은 익명화된 값을 프리필하지 않는다(rejoin 안내만). 그 외(미완성 활성)는 기존값 프리필.
  const isWithdrawn = expert?.status === 'withdrawn'
  const defaults: RegisterDefaults | undefined =
    expert && !isWithdrawn
      ? {
          field: expert.field,
          career_years: expert.career_years,
          hourly_rate: expert.hourly_rate,
          real_name: expert.real_name,
          name: expert.name,
          contact: expert.contact,
        }
      : undefined

  return <RegisterForm rejoin={rejoin === '1' || isWithdrawn} defaults={defaults} />
}
