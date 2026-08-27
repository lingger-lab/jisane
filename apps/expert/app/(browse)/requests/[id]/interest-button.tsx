'use client'

import { useState } from 'react'
import { expressInterest, withdrawInterest } from '@/lib/interest/actions'
import { Button } from '@jisane/ui/button'

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
      <Button
        type="button"
        variant={isInterested ? 'outline' : 'accent'}
        onClick={handleClick}
        disabled={isLoading}
        className={`h-12 w-full font-semibold ${
          isInterested ? 'border-accent/30 bg-accent/5 text-accent' : 'shadow-sm hover:shadow-md'
        }`}
      >
        {isLoading ? '처리 중...' : isInterested ? '관심 표현 완료' : '관심 표현하기'}
      </Button>
    </div>
  )
}
