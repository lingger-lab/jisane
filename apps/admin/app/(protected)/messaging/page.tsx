import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { isKakaoConfigured } from '@jisane/shared/notify/kakao'
import { getMarketingConsentCount } from '@jisane/shared/consent/consent'
import { PageHero } from '@jisane/ui/page-hero'
import { MessagingConsole, type Campaign } from './messaging-console'

export const metadata = { robots: { index: false, follow: false } }

export default async function MessagingPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!(await verifyAdmin())) redirect('/login?error=forbidden')

  const [configured, consentCount, { data: rows }] = await Promise.all([
    Promise.resolve(isKakaoConfigured()),
    getMarketingConsentCount(),
    adminClient
      .from('message_campaign')
      .select('id, title, channel, body, status, scheduled_at, target_count, sent_count, failed_count, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const campaigns = (rows ?? []) as Campaign[]

  return (
    <div className="flex flex-1 flex-col">
      <PageHero container="read" eyebrow="관리자" title="마케팅 발송" subtitle="카카오 친구톡·문자로 마케팅 수신 동의자에게 발송" />
      <div className="container-read px-4 md:px-6 py-6">
        <MessagingConsole
          configured={configured}
          consentCount={consentCount}
          campaigns={campaigns}
          unsubHint={process.env.SOLAPI_UNSUB_NUMBER || ''}
        />
      </div>
    </div>
  )
}
