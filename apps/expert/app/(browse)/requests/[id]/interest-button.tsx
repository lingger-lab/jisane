'use client'

import { useState } from 'react'
import { expressInterest, withdrawInterest } from '@/lib/interest/actions'

interface InterestButtonProps {
  requestId: string
  initialInterested: boolean
}

export function InterestButton({ requestId, initialInterested }: InterestButtonProps) {
  const [isInterested, setIsInterested] = useState(initialInterested)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setIsLoading(true)
    setError(null)

    if (isInterested) {
      const result = await withdrawInterest(requestId)
      if (result.error) {
        setError(result.error)
      } else {
        setIsInterested(false)
      }
    } else {
      const result = await expressInterest(requestId)
      if (result.error) {
        setError(result.error)
      } else {
        setIsInterested(true)
      }
    }

    setIsLoading(false)
  }

  return (
    <div>
      {error && <p className="mb-2 text-xs text-error text-center">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50 ${
          isInterested
            ? 'border border-accent/30 bg-accent/5 text-accent'
            : 'bg-accent text-white shadow-sm hover:bg-accent/90 hover:shadow-md'
        }`}
      >
        {isLoading ? '처리 중...' : isInterested ? '관심 표현 완료' : '관심 표현하기'}
      </button>
    </div>
  )
}
