import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'

// 인증 전용 영역 — 색인 억제(robots.txt disallow에 더해 명시적 noindex 2중 방어).
export const metadata = { robots: { index: false, follow: false } }

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
