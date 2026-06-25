'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const SUCCESS_MESSAGES: Record<string, string> = {
  request_created: '의뢰가 등록되었습니다',
  partner_registered: '파트너 등록이 완료되었습니다',
  profile_updated: '프로필이 수정되었습니다',
  deal_approved: '견적이 승인되었습니다',
  deal_confirmed: '검수가 완료되었습니다',
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
