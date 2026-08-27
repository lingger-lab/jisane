import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'

export default async function ClientMainLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  // 미로그인으로 보호된 탭(의뢰하기·마이페이지 등) 진입 시 — 조용히 홈으로 튕기지 않고
  // 홈에서 "회원가입·로그인 후 이용" 안내 토스트를 띄운다(ErrorToast가 ?error= 읽음).
  if (!user) {
    redirect('/?error=login_required')
  }

  // 하단 탭은 root layout에서 전역 렌더 (로그인 전후 공통)
  return <div className="flex flex-1 flex-col">{children}</div>
}
