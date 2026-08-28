import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { MembersNav } from './members-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    redirect('/login')
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  if (!adminEmails.includes(user.email.toLowerCase())) {
    redirect('/login?error=forbidden')
  }

  return (
    <>
      {/* 모바일 오버플로우 방지: 한 줄 유지 + 가로 스크롤(2줄 넘침 해소) */}
      <nav className="border-b border-border-light bg-background px-6 py-3">
        <div className="mx-auto flex max-w-5xl flex-nowrap items-center gap-4 overflow-x-auto">
          <span className="shrink-0 text-lg font-bold text-primary">관리자</span>
          <Link href="/dashboard" className="shrink-0 whitespace-nowrap text-sm text-text-muted hover:text-text">대시보드</Link>
          <span className="shrink-0"><MembersNav /></span>
          <Link href="/dashboard/enterprise-services" className="shrink-0 whitespace-nowrap text-sm text-text-muted hover:text-text">기업 전문서비스</Link>
          <Link href="/dashboard/knowledge-studio" className="shrink-0 whitespace-nowrap text-sm text-text-muted hover:text-text">지식서비스 스튜디오</Link>
          <Link href="/dashboard/event-referrals" className="shrink-0 whitespace-nowrap text-sm text-text-muted hover:text-text">이벤트 접수</Link>
          <Link href="/message-audit" className="shrink-0 whitespace-nowrap text-sm text-text-muted hover:text-text">메시지 감사</Link>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </>
  )
}
