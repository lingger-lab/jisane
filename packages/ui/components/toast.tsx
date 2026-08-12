'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { successDismissMs, errorDismissMs } from './toast-policy'

/**
 * 토스트 코드 맵.
 *
 * 이 맵과 방출부(리다이렉트 URL의 ?success= / ?error=)는 서로 다른 파일에 흩어져 있어
 * 조용히 어긋난다 — 맵에 없는 코드로 리다이렉트하면 사용자는 **아무 안내도 못 본다**.
 * 코드를 추가할 때는 반드시 이 맵에도 넣고, 방출부는 아래 SuccessCode/ErrorCode 타입을
 * 참조해 오타를 컴파일 타임에 잡을 것.
 */
const SUCCESS_MESSAGES = {
  request_created: '의뢰가 등록되었습니다',
  created: '등록되었습니다',
  saved: '저장되었습니다',
  profile_updated: '프로필이 수정되었습니다',
  deal_approved: '견적이 승인되었습니다',
  payment: '결제가 완료되었습니다. 작업이 시작됩니다.',
  deal_confirmed: '검수가 완료되었습니다',
  service_ordered: '서비스가 접수되었습니다. 담당 매니저가 곧 연락드리겠습니다.',
  education_ordered: '교육 신청이 접수되었습니다. 담당 매니저가 곧 연락드리겠습니다.',
  invitation_sent: '초빙 요청이 전달되었습니다. 전문가 수락을 기다려주세요.',
  invitation_accepted: '초빙을 수락했습니다. 작업이 시작됩니다.',
  invitation_declined: '초빙을 거절했습니다.',
} as const

/** 리다이렉트에 쓸 수 있는 success 코드. 방출부에서 이 타입을 참조해 오타를 막을 것. */
export type SuccessCode = keyof typeof SUCCESS_MESSAGES

export function SuccessToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  // 지속 시간은 코드에 따라 다르다(결제류 연장 — 감사 docs/10 P2-50) — 문구와 함께 보관
  const [toast, setToast] = useState<{ text: string; dismissMs: number } | null>(null)

  useEffect(() => {
    const key = searchParams.get('success')
    // 쿼리값은 임의 문자열이므로 맵에 있는 코드만 통과시킨다.
    const text = key ? (SUCCESS_MESSAGES as Record<string, string | undefined>)[key] : undefined
    if (!key || !text) return

    setToast({ text, dismissMs: successDismissMs(key) })

    // URL에서 success 파라미터 제거
    const url = new URL(window.location.href)
    url.searchParams.delete('success')
    router.replace(url.pathname + url.search, { scroll: false })
  }, [searchParams, router])

  // 자동 소멸 타이머는 toast에만 의존한다.
  // 위 effect에 함께 두면 router.replace가 searchParams를 바꿔 effect가 재실행되고,
  // 그 cleanup이 방금 건 타이머를 취소해 토스트가 영구히 남는다.
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.dismissMs)
    return () => clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  return (
    // pointer-events-none: 배너가 덮은 띠 영역의 클릭이 막히지 않도록 컨테이너는 투명하게 두고,
    // 실제 배너에만 이벤트를 되살린다.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-16 left-1/2 z-50 -translate-x-1/2 animate-fade-in"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-success px-5 py-3 text-sm font-medium text-white shadow-lg">
        <span>{toast.text}</span>
        <button
          type="button"
          onClick={() => setToast(null)}
          aria-label="알림 닫기"
          // 24×24px 최소 타깃(WCAG 2.5.8) — -my-1로 토스트 높이는 종전과 동일하게 유지
          className="focus-ring -my-1 -mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/70 transition-colors hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

const ERROR_MESSAGES = {
  unauthorized: '로그인이 필요합니다',
  forbidden: '접근 권한이 없습니다',
  not_found: '요청한 정보를 찾을 수 없습니다',
  payment_failed: '결제에 실패했습니다',
  payment: '결제 처리 중 문제가 발생했습니다. 결제내역 확인이 필요하니 고객센터로 문의해주세요.',
  payment_invalid: '결제 정보가 올바르지 않습니다',
  server_error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
  deal_not_available: '해당 거래를 진행할 수 없습니다',
  already_reviewed: '이미 리뷰를 작성하셨습니다',
  invalid_input: '입력값을 확인해주세요',
  // 인증 콜백(OAuth)이 '/'로 되돌려보낼 때 쓰는 코드들.
  // 맵에 없으면 로그인 실패가 아무 설명 없이 홈으로 튕기는 것처럼 보인다.
  no_code: '로그인이 완료되지 않았습니다. 다시 시도해주세요',
  exchange_failed: '로그인 처리에 실패했습니다. 다시 시도해주세요',
  no_user: '사용자 정보를 가져오지 못했습니다. 다시 로그인해주세요',
  profile_create: '회원 정보 생성에 실패했습니다. 잠시 후 다시 시도해주세요',
} as const

/** 리다이렉트에 쓸 수 있는 error 코드. 방출부에서 이 타입을 참조해 오타를 막을 것. */
export type ErrorCode = keyof typeof ERROR_MESSAGES

export function ErrorToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  // dismissMs가 null이면 수동 닫기 전까지 유지 — 결제류 에러는 URL 파라미터가 이미
  // 제거된 뒤라 자동 소멸을 놓치면 재확인이 불가능하다(감사 docs/10 P2-50).
  const [toast, setToast] = useState<{ text: string; dismissMs: number | null } | null>(null)

  useEffect(() => {
    const key = searchParams.get('error')
    if (!key) return

    // 화이트리스트만 렌더한다. 원본 쿼리값을 그대로 띄우면 임의 문장을
    // 사이트 알림 UI로 표시할 수 있어(피싱 문구 주입) 내부 코드도 노출된다.
    setToast({
      text:
        (ERROR_MESSAGES as Record<string, string | undefined>)[key] || ERROR_MESSAGES.server_error,
      dismissMs: errorDismissMs(key),
    })

    const url = new URL(window.location.href)
    url.searchParams.delete('error')
    router.replace(url.pathname + url.search, { scroll: false })
  }, [searchParams, router])

  // 자동 소멸 타이머는 toast에만 의존 (SuccessToast와 동일한 이유)
  useEffect(() => {
    if (!toast || toast.dismissMs === null) return
    const timer = setTimeout(() => setToast(null), toast.dismissMs)
    return () => clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="pointer-events-none fixed top-16 left-1/2 z-50 -translate-x-1/2 animate-fade-in"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-error px-5 py-3 text-sm font-medium text-white shadow-lg">
        <span>{toast.text}</span>
        <button
          type="button"
          onClick={() => setToast(null)}
          aria-label="알림 닫기"
          // 24×24px 최소 타깃(WCAG 2.5.8) — -my-1로 토스트 높이는 종전과 동일하게 유지
          className="focus-ring -my-1 -mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/70 transition-colors hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
