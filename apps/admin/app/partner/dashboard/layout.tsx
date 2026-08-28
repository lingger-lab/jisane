import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { requireActiveProvider } from '@jisane/shared/provider/auth'
import { PageHero } from '@jisane/ui/page-hero'

/**
 * 전문가회원 대시보드 가드 — 인가는 세션이 아니라 provider 레코드+status로 판단.
 * (쿠키가 .jisane.cloud 전역 공유라 owner/expert 회원도 세션은 있음)
 */
export default async function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/partner')

  const guard = await requireActiveProvider(user.id)
  if (!guard.ok) {
    // no_provider → 신청 폼, pending/rejected/suspended → 상태 안내 (apply 페이지가 겸용)
    redirect('/partner/apply')
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHero
        eyebrow="전문가회원"
        title={guard.provider.name}
        subtitle="전문가회원 대시보드 · 활동 중"
      />
      <div className="mx-auto w-full max-w-4xl px-4 md:px-6 py-6">
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-surface p-1">
        {[
          { href: '/partner/dashboard', label: '개요' },
          { href: '/partner/dashboard/profile', label: '전문가회원 정보' },
          { href: '/partner/dashboard/services', label: '지식서비스 스튜디오' },
          { href: '/partner/dashboard/orders', label: '신청 확인' },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="shrink-0 rounded-md px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-card hover:text-text"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
      </div>
    </div>
  )
}
