'use client'

import { useState } from 'react'
import { Button } from '@jisane/ui/button'

interface PaymentButtonProps {
  dealId: string
  /** 실제 청구액(공급가+부가세). 서버가 청구하는 금액과 같은 값이어야 한다. */
  amount: number
  /** 서버에서 판정한 결제 활성화 여부(토스 키 주입 전이면 false) */
  enabled: boolean
  /** 무료 운영 기간 여부(§0) — enabled=false일 때 "결제 준비중" 대신 무료 안내를 노출 */
  freeMode?: boolean
  onError: (message: string) => void
}

/**
 * 견적 승인 = 에스크로 예치 결제 방아쇠.
 * 체크아웃 세션을 서버에서 생성(금액은 서버의 deal.total_pay 사용)한 뒤 토스 결제창으로 이동한다.
 * 결제 성공 시 /api/payments/success 가 승인·예치를 기록하고 deal을 working으로 전이시킨다.
 */
export function PaymentButton({ dealId, amount, enabled, freeMode, onError }: PaymentButtonProps) {
  const [pending, setPending] = useState(false)

  if (!enabled) {
    // 무료 기간(§0): 온라인 결제 대신 관리자 오프라인 에스크로 안내(dead-end 방지).
    if (freeMode) {
      return (
        <div className="flex-1 rounded-xl border border-border bg-surface-warm px-4 py-3 text-center">
          <p className="text-sm font-semibold text-text">무료 기간 · 지사네 수수료 없음</p>
          <p className="mt-1 text-xs text-text-muted">
            작업비는 지사네 안내에 따라 입금해 주세요. 관리자 확인 후 작업이 시작됩니다.
          </p>
        </div>
      )
    }
    return (
      <div className="flex-1">
        <button
          type="button"
          disabled
          className="w-full rounded-xl bg-surface px-4 py-3 font-semibold text-text-subtle disabled:opacity-70"
        >
          결제 준비중
        </button>
        <p className="mt-1 text-center text-xs text-text-subtle">
          결제 준비가 완료되면 안내드리겠습니다.
        </p>
      </div>
    )
  }

  async function handlePay() {
    if (
      !confirm(
        `${amount.toLocaleString('ko-KR')}원(부가세 포함)을 결제하시겠습니까?\n결제 금액은 에스크로에 예치되며, 검수 완료 후 시니어지식인에게 정산됩니다.`
      )
    ) {
      return
    }

    setPending(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal_id: dealId }),
        // 서버의 Toss 호출 타임아웃(30초)보다 약간 길게 잡아 서버 에러 응답이 먼저 도착하게
        // 한다. 브라우저 fetch는 기본 타임아웃이 없어, 이게 없으면 서버가 매달릴 때 버튼이
        // '결제창 여는 중...'으로 영구 고착된다(감사 docs/11 P3-81).
        signal: AbortSignal.timeout(35_000),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data.checkout_url) {
        onError(data.error || '결제 요청에 실패했습니다. 잠시 후 다시 시도해주세요.')
        setPending(false)
        return
      }

      // 토스 결제창으로 이동 (이후 success/fail 라우트로 리다이렉트되어 돌아온다)
      window.location.href = data.checkout_url
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        onError('결제 요청이 시간을 초과했습니다. 잠시 후 다시 시도해주세요.')
      } else {
        onError('결제 요청 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.')
      }
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="accent"
      onClick={handlePay}
      disabled={pending}
      className="h-12 w-full flex-1 font-semibold shadow-sm hover:shadow-md"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          결제창 여는 중...
        </>
      ) : (
        '견적 승인 · 결제'
      )}
    </Button>
  )
}
