import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    redirect('/')
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  if (!adminEmails.includes(user.email.toLowerCase())) {
    redirect('/')
  }

  return (
    <>
      <nav className="border-b border-border-light bg-background px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <span className="text-lg font-bold text-primary">관리자</span>
          <Link href="/dashboard" className="text-sm text-text-muted hover:text-text">대시보드</Link>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </>
  )
}
