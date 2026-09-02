import { parseUnsubscribeToken } from '@jisane/shared/messaging/token'
import { withdrawMarketingConsent } from '@jisane/shared/consent/consent'
import { PageHero } from '@jisane/ui/page-hero'

export const metadata = { robots: { index: false, follow: false } }

// 원클릭 수신거부 — 마케팅 메시지 하단 링크로 진입. ?t=<서명토큰>. 유효하면 마케팅 수신 철회.
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t } = await searchParams
  const secret = process.env.MESSAGING_UNSUB_SECRET || ''
  let done = false
  if (t && secret) {
    const phone = parseUnsubscribeToken(t, secret)
    if (phone) {
      await withdrawMarketingConsent({ phone, source: 'unsubscribe_link' })
      done = true
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHero container="read" eyebrow="지사네" title="마케팅 수신 거부" size="lg" />
      <div className="container-read px-4 md:px-6 py-10 text-center">
        {done ? (
          <>
            <p className="text-base font-semibold text-text">마케팅 정보 수신이 해지되었습니다.</p>
            <p className="mt-2 text-sm text-text-muted">앞으로 지사네의 마케팅·광고 메시지를 받지 않습니다. (상담·서비스 관련 필수 안내는 계속 발송될 수 있습니다.)</p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold text-text">수신거부 링크가 유효하지 않습니다.</p>
            <p className="mt-2 text-sm text-text-muted">링크가 만료되었거나 잘못되었습니다. 문의: iamblackwhite86@gmail.com</p>
          </>
        )}
      </div>
    </div>
  )
}
