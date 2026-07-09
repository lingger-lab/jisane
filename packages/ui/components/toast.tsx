'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const SUCCESS_MESSAGES: Record<string, string> = {
  request_created: '의뢰가 등록되었습니다',
  partner_registered: '파트너 등록이 완료되었습니다',
  profile_updated: '프로필이 수정되었습니다',
  deal_approved: '견적이 승인되었습니다',
  deal_confirmed: '검수가 완료되었습니다',
  service_ordered: '서비스가 접수되었습니다. 담당 매니저가 곧 연락드리겠습니다.',
  education_ordered: '교육 신청이 접수되었습니다. 담당 매니저가 곧 연락드리겠습니다.',
}

export function SuccessToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const key = searchParams.get('success')
    if (key && SUCCESS_MESSAGES[key]) {
      setMessage(SUCCESS_MESSAGES[key])

      // URL에서 success 파라미터 제거
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      router.replace(url.pathname + url.search, { scroll: false })

      // 3초 후 자동 소멸
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 left-1/2 z-50 -translate-x-1/2 animate-fade-in"
    >
      <div className="rounded-xl bg-success px-5 py-3 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  )
}

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: '로그인이 필요합니다',
  forbidden: '접근 권한이 없습니다',
  not_found: '요청한 정보를 찾을 수 없습니다',
  payment_failed: '결제에 실패했습니다',
  server_error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
  deal_not_available: '해당 거래를 진행할 수 없습니다',
  already_reviewed: '이미 리뷰를 작성하셨습니다',
  invalid_input: '입력값을 확인해주세요',
}

export function ErrorToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const key = searchParams.get('error')
    if (key) {
      setMessage(ERROR_MESSAGES[key] || key)

      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      router.replace(url.pathname + url.search, { scroll: false })

      const timer = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  if (!message) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-16 left-1/2 z-50 -translate-x-1/2 animate-fade-in"
    >
      <div className="rounded-xl bg-error px-5 py-3 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  )
}
