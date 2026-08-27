'use client'

import { useState } from 'react'
import { sendDealInquiry } from '@/lib/message/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import { Button } from '@jisane/ui/button'
import { calcPayableAmount, calcVat } from '@jisane/shared/pricing'
import { PaymentButton } from './payment-button'

/**
 * 이 컴포넌트는 클라이언트 컴포넌트라 props가 RSC 페이로드로 브라우저에 직렬화된다.
 * 따라서 화면에 실제로 쓰는 필드만 받는다 — DealRow/ExpertRow 전체를 넘기면
 * 내부 수수료 분해(work_fee·match_fee)와 전문가 실명·auth_user_id까지 노출되어
 * 익명화(직거래 방지) 설계가 무너진다.
 */
interface QuoteSectionProps {
  deal: { id: string; total_pay: number; due_date: string | null }
  expert: { field: string | null; career_years: number | null } | null
  /** 서버에서 판정한 결제 활성화 여부 (토스 키 주입 전이면 false) */
  paymentEnabled: boolean
  /** 무료 운영 기간 여부 (§0) — 지사네 수수료 0, 작업비는 관리자 오프라인 에스크로 */
  freeModeEnabled: boolean
}

export function QuoteSection({ deal, expert, paymentEnabled, freeModeEnabled }: QuoteSectionProps) {
  const [error, setError] = useState<string | null>(null)
  const [showInquiry, setShowInquiry] = useState(false)
  const [inquiryText, setInquiryText] = useState('')
  const [inquirySent, setInquirySent] = useState(false)

  async function handleInquiry() {
    // 빈 제출을 조용히 무시하면 사용자는 버튼이 고장난 줄 안다 — 이유를 표시한다.
    if (!inquiryText.trim()) {
      setError('문의 내용을 입력해주세요.')
      return
    }
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

      {/* 익명 시니어지식인 카드 */}
      <div className="mb-4 rounded-xl border border-border-light bg-background p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-medium">
            지
          </div>
          <div>
            <p className="font-medium text-text">
              {expert?.career_years
                ? `경력 ${expert.career_years}년 시니어지식인`
                : '지사네 인증 시니어지식인'}
            </p>
            {expert?.field && (
              <p className="text-xs text-text-muted">전문 분야: {expert.field}</p>
            )}
          </div>
        </div>
      </div>

      {/* 총 금액 — 내역(work_fee/match_fee)은 숨기고 합계만 표시 (직거래 방지).
          무료 기간엔 지사네 수수료가 0이라 작업비만 표시(VAT 처리는 §10 게이트). */}
      {freeModeEnabled ? (
        <div className="mb-4 text-center">
          <p className="text-sm text-text-muted">작업비 (지사네 수수료 무료)</p>
          <p className="text-3xl font-bold text-accent tabular-nums">
            {deal.total_pay.toLocaleString('ko-KR')}
            <span className="text-base font-normal">원</span>
          </p>
          <p className="mt-1 text-xs text-text-subtle">시니어지식인에게 지급되는 작업비입니다.</p>
        </div>
      ) : (
        <div className="mb-4 text-center">
          <p className="text-sm text-text-muted">총 결제 금액</p>
          <p className="text-3xl font-bold text-accent tabular-nums">
            {calcPayableAmount(deal.total_pay).toLocaleString('ko-KR')}
            <span className="text-base font-normal">원</span>
          </p>
          <p className="mt-1 text-xs text-text-subtle tabular-nums">
            공급가 {deal.total_pay.toLocaleString('ko-KR')}원 + 부가세{' '}
            {calcVat(deal.total_pay).toLocaleString('ko-KR')}원
          </p>
        </div>
      )}

      {/* 진행 안내 */}
      <div className="mb-4 rounded-xl bg-background p-3">
        <p className="text-xs text-text-muted">
          {freeModeEnabled
            ? '무료 기간 — 지사네 수수료 없이 진행됩니다. 작업비는 지사네 안내에 따라 입금하시면 관리자 확인 후 작업이 시작되고, 검수 완료 후 시니어지식인에게 지급됩니다.'
            : '지사네 에스크로 안전결제로 진행됩니다. 결제 금액은 작업 완료 및 검수 확인 후 시니어지식인에게 정산됩니다.'}
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
        <PaymentButton
          dealId={deal.id}
          amount={calcPayableAmount(deal.total_pay)}
          enabled={paymentEnabled}
          freeMode={freeModeEnabled}
          onError={setError}
        />
        {!showInquiry && !inquirySent && (
          <Button type="button" variant="outline" onClick={() => setShowInquiry(true)} className="h-12">
            금액 상의
          </Button>
        )}
      </div>

      {showInquiry && !inquirySent && (
        <form action={handleInquiry} className="mt-3 flex flex-col gap-2">
          <label htmlFor="quote-inquiry" className="text-sm font-medium text-text">
            금액 상의 내용
          </label>
          <textarea
            id="quote-inquiry"
            value={inquiryText}
            onChange={(e) => setInquiryText(e.target.value)}
            rows={3}
            placeholder="견적에 대해 궁금한 점이나 조정이 필요한 부분을 적어주세요."
            className="w-full resize-none rounded-xl border border-border-light bg-background px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
          />
          <div className="flex gap-2">
            <SubmitButton variant="accent" size="sm" className="flex-1">
              메시지 전송
            </SubmitButton>
            <Button type="button" variant="outline" size="sm" onClick={() => { setShowInquiry(false); setInquiryText('') }}>
              취소
            </Button>
          </div>
        </form>
      )}

      {inquirySent && (
        <div className="mt-3 rounded-xl border border-success/20 bg-success-light p-3 text-center">
          <p className="text-sm font-medium text-success">메시지가 전송되었습니다</p>
          <p className="mt-1 text-xs text-text-muted">매니저가 확인 후 안내드리겠습니다.</p>
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
