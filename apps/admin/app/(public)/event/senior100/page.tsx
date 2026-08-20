import { adminClient } from '@jisane/shared/supabase/admin'
import { pageMetadata } from '@jisane/shared/seo'
import { PageHero } from '@jisane/ui/page-hero'
import { ReferralForm } from './referral-form'

export const metadata = pageMetadata('admin', {
  title: '시니어지식인 100인 초빙 이벤트',
  description:
    '경험과 지식이 다시 기회가 되는 곳 — 지사네 시니어 지식인 100인 초빙. 1명 추천 2만원부터 최대 20만원 현금 리워드. ~9월 30일.',
  path: '/event/senior100',
})

const TIERS = [
  { n: '1명', add: '2만원', total: '2만원' },
  { n: '2명', add: '+3만원', total: '5만원' },
  { n: '3명', add: '+4만원', total: '9만원' },
  { n: '4명', add: '+5만원', total: '14만원' },
  { n: '5명', add: '+6만원', total: '20만원' },
]

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-light bg-card p-3 text-center">
      <p className="text-xs text-text-subtle">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-text">{value}</p>
    </div>
  )
}

export default async function EventSenior100Page() {
  const { data: notice } = await adminClient
    .from('event_notice')
    .select('body, published')
    .eq('event_code', 'senior100')
    .single()

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero
        eyebrow="시니어지식인 회원 이벤트"
        title="시니어 지식인 100인 초빙"
        subtitle="경험과 지식이 다시 기회가 되는 곳 — 지사네와 함께할 1기 100인을 초빙합니다."
      />

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 md:px-6 py-6">
        {/* 발표 공지 배너 (관리자 게시 시) */}
        {notice?.published && notice.body && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
            <p className="text-xs font-semibold text-accent">[공지]</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-text">{notice.body}</p>
          </div>
        )}

        <section className="text-sm leading-relaxed text-text-muted">
          다양한 경험과 전문성을 가진 시니어 지식인 100명을 우선 초빙합니다. 기업경영·재무회계·마케팅영업·생산품질·기술R&amp;D·수출해외·인사노무·AI/IT 등 중소기업에 경험과 지식을 나눠주실 좋은 분을 시니어지식인 회원으로 초빙해 주세요.
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Info label="초빙 자격" value="가입 시니어지식인 회원" />
          <Info label="이벤트 기간" value="~ 9월 30일" />
          <Info label="지급" value="종료 후 10일 내 현금" />
        </section>

        <section>
          <h2 className="mb-2 text-lg font-serif font-bold text-text">지급 기준</h2>
          <div className="overflow-x-auto rounded-xl border border-border-light">
            <table className="w-full text-sm">
              <thead className="bg-surface-warm text-text-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">추천 인원</th>
                  <th className="px-4 py-2 text-right font-medium">추가 지급</th>
                  <th className="px-4 py-2 text-right font-medium">누적</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((t) => (
                  <tr key={t.n} className="border-t border-border-light">
                    <td className="px-4 py-2 text-text">{t.n}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-text-muted">{t.add}</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums text-accent">{t.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-text-subtle">시니어지식인 회원 1인당 최대 5명·총 20만원까지 가능합니다.</p>
        </section>

        <section className="rounded-xl bg-surface-warm p-4 text-sm leading-relaxed text-text-muted">
          <span className="font-semibold text-text">유효회원 인정</span> — 초빙하신 분이 지사네 플랫폼에 가입하고 기본 프로필 등록(전문 분야 선택)을 완료하면 유효회원으로 인정됩니다.
        </section>

        <section>
          <h2 className="mb-3 text-lg font-serif font-bold text-text">초빙 접수</h2>
          <ReferralForm />
        </section>

        <p className="text-xs text-text-subtle">
          ※ 이벤트 현황·결과는 이 페이지 공지로 안내드리며, 지급 대상은 개별 연락드립니다.
        </p>
      </div>
    </div>
  )
}
