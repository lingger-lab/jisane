import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'

export default async function ClientMainLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 하단 탭은 root layout에서 전역 렌더 (로그인 전후 공통)
  return <div className="flex flex-1 flex-col">{children}</div>
}
