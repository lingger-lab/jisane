import { redirect } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { EventReferralsList, type EventReferralItem } from './event-referrals-list'
import { NoticeEditor } from './notice-editor'

export const metadata = { title: '이벤트 접수 관리 | 지사네 관리자' }

export default async function EventReferralsPage() {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const [{ data: referrals }, { data: notice }] = await Promise.all([
    adminClient
      .from('event_referral')
      .select('id, referrer_name, referrer_contact, referrer_email, referee_name, referee_contact, note, status, created_at')
      .eq('event_code', 'senior100')
      .order('created_at', { ascending: false }),
    adminClient
      .from('event_notice')
      .select('body, published')
      .eq('event_code', 'senior100')
      .single(),
  ])

  const items = (referrals ?? []) as EventReferralItem[]

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 md:px-6 py-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-serif font-bold text-text">시니어 100인 초빙 — 이벤트 접수 관리</h1>
        <p className="mt-0.5 text-sm text-text-muted">추천 접수 현황 관리 + 발표 공지 편집.</p>
      </div>

      <NoticeEditor defaultBody={notice?.body ?? ''} defaultPublished={notice?.published ?? false} />

      <div>
        <h2 className="mb-3 text-sm font-bold text-text">
          추천 접수 <span className="text-text-subtle">({items.length})</span>
        </h2>
        {items.length === 0 ? (
          <p className="rounded-lg border border-border-light p-6 text-center text-sm text-text-muted">
            아직 접수가 없습니다.
          </p>
        ) : (
          <EventReferralsList items={items} />
        )}
      </div>
    </div>
  )
}
