import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { PageHero } from '@jisane/ui/page-hero'
import { Button } from '@jisane/ui/button'
import { reactivateOwnerSelf } from '@/lib/profile/actions'

export const metadata = { title: '계정 재활성 | 지사네' }

export default async function RejoinPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: owner } = await adminClient.from('owner').select('id, status').eq('auth_user_id', user.id).single()
  // 탈퇴 상태가 아니면 정상 진입 — 홈으로.
  if (!owner || owner.status !== 'withdrawn') redirect('/')

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero container="form" eyebrow="기업회원" title="탈퇴한 계정입니다" subtitle="다시 이용하시려면 계정을 재활성할 수 있습니다." />
      <div className="container-form px-4 md:px-6 py-8">
        <div className="rounded-xl border border-border-light bg-surface-warm p-5">
          <p className="text-sm leading-relaxed text-text-muted">
            이 계정은 탈퇴 처리되어 회사 정보가 익명화된 상태입니다. 재활성하면 다시 이용할 수 있으며,
            회사 정보는 마이페이지에서 새로 입력해 주세요. 지난 거래·정산 기록은 그대로 보존됩니다.
          </p>
          <form action={reactivateOwnerSelf} className="mt-5">
            <Button type="submit" variant="primary" className="h-12 w-full shadow-sm hover:shadow-md">
              계정 재활성하기
            </Button>
          </form>
          <Link href="/" className="mt-3 block text-center text-xs text-text-subtle hover:text-text-muted transition-colors">
            나중에 하기
          </Link>
        </div>
      </div>
    </div>
  )
}
