import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    redirect('/')
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim())
  if (!adminEmails.includes(user.email)) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-lg font-bold text-accent">
              곁에 관리자
            </Link>
            <nav className="flex gap-3">
              <Link
                href="/admin/dashboard"
                className="text-sm text-text-muted hover:text-text"
              >
                대시보드
              </Link>
            </nav>
          </div>
          <span className="text-xs text-text-muted">{user.email}</span>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
