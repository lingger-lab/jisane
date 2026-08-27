import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'

export default async function ExpertMainLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  // 미로그인으로 보호된 탭(초빙·작업·프로필 등) 진입 시 — 홈에서 안내 토스트(ErrorToast).
  if (!user) {
    redirect('/?error=login_required')
  }

  // 하단 탭은 root layout에서 전역 렌더 (로그인 전후 공통)
  return <div className="flex flex-1 flex-col">{children}</div>
}
