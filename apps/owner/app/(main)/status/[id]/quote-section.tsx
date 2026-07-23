'use client'

import { useState } from 'react'
import { approveDeal } from '@/lib/deal/actions'
import { sendDealInquiry } from '@/lib/message/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import type { DealRow, ExpertRow } from '@jisane/shared/types'

interface QuoteSectionProps {
  deal: DealRow
  expert: ExpertRow | null
}

export function QuoteSection({ deal, expert }: QuoteSectionProps) {
  const [error, setError] = useState<string | null>(null)
  const [showInquiry, setShowInquiry] = useState(false)
  const [inquiryText, setInquiryText] = useState('')
  const [inquirySent, setInquirySent] = useState(false)

  async function handleApprove() {
    if (!confirm(`견적 ${deal.total_pay.toLocaleString('ko-KR')}원(VAT 별도)을 승인하시겠습니까?`)) return
    const result = await approveDeal(deal.id)
    if (result?.error) {
      setError(result.error)
    }
  }

  async function handleInquiry() {
    if (!inquiryText.trim()) return
    setError(null)
    const result = await sendDealInquiry(deal.id, inquiryText.trim(), 'deal_quote')
    if (result.error) {
      setError(result.error)
    } else {
      setInquirySent(true)
      setInquiryText('')
    }
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-surface-warm p-4 shadow-sm animate-scale-in">
      <h2 className="mb-4 font-semibold text-text">견적이 도착했습니다</h2>

      {/* 익명 전문가 카드 */}
      <div className="mb-4 rounded-xl border border-border-light bg-background p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-medium">
            P
          </div>
          <div>
            <p className="font-medium text-text">
              {expert?.career_years
                ? `경력 ${expert.career_years}년 전문가`
                : '지사네 인증 전문가'}
            </p>
            {expert?.field && (
              <p className="text-xs text-text-muted">전문 분야: {expert.field}</p>
            )}
          </div>
        </div>
      </div>

      {/* 총 금액 — total_pay만 표시 (직거래 방지) */}
      <div className="mb-4 text-center">
        <p className="text-sm text-text-muted">총 비용</p>
        <p className="text-3xl font-bold text-accent">
          {deal.total_pay.toLocaleString('ko-KR')}
          <span className="text-base font-normal">원</span>
        </p>
        <p className="mt-1 text-xs text-text-subtle">VAT 별도</p>
      </div>

      {/* 에스크로 안내 */}
      <div className="mb-4 rounded-xl bg-background p-3">
        <p className="text-xs text-text-muted">
          지사네 에스크로 안전결제로 진행됩니다. 결제 금액은 작업 완료 및 검수
          확인 후 전문가에게 정산됩니다.
        </p>
      </div>

      {/* 납기일 */}
      {deal.due_date && (
        <p className="mb-4 text-sm text-text-muted">
          예상 납기일: {new Date(deal.due_date).toLocaleDateString('ko-KR')}
        </p>
      )}

      {/* 에러 */}
      {error && <p className="mb-2 text-sm text-error">{error}</p>}

      {/* 버튼 */}
      <div className="flex gap-3">
        <form action={handleApprove} className="flex-1">
          <SubmitButton className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md disabled:opacity-50">
            견적 승인
          </SubmitButton>
        </form>
        {!showInquiry && !inquirySent && (
          <button
            type="button"
            onClick={() => setShowInquiry(true)}
            className="flex items-center justify-center rounded-xl border border-border-light px-4 py-3 text-sm text-text-muted transition-colors hover:bg-surface"
          >
            금액 상의
          </button>
        )}
      </div>

      {showInquiry && !inquirySent && (
        <form action={handleInquiry} className="mt-3 flex flex-col gap-2">
          <textarea
            value={inquiryText}
            onChange={(e) => setInquiryText(e.target.value)}
            rows={3}
            placeholder="견적에 대해 궁금한 점이나 조정이 필요한 부분을 적어주세요."
            className="w-full resize-none rounded-xl border border-border-light bg-background px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
          />
          <div className="flex gap-2">
            <SubmitButton className="flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50">
              메시지 전송
            </SubmitButton>
            <button
              type="button"
              onClick={() => { setShowInquiry(false); setInquiryText('') }}
              className="rounded-xl border border-border-light px-4 py-2 text-sm text-text-muted transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {inquirySent && (
        <div className="mt-3 rounded-xl border border-success/20 bg-success-light p-3 text-center">
          <p className="text-sm font-medium text-success">메시지가 전송되었습니다</p>
          <p className="mt-1 text-xs text-success/70">매니저가 확인 후 안내드리겠습니다.</p>
          <button
            type="button"
            onClick={() => { setInquirySent(false); setShowInquiry(true) }}
            className="mt-2 text-xs font-medium text-accent hover:underline"
          >
            추가 메시지 보내기
          </button>
        </div>
      )}
    </div>
  )
}
