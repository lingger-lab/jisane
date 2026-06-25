'use client'

import { useState } from 'react'
import { acceptMatching, rejectMatching } from '@/lib/matching/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

interface MatchingActionsProps {
  matchingId: string
}

export function MatchingActions({ matchingId }: MatchingActionsProps) {
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    const result = await acceptMatching(matchingId)
    if (result?.error) {
      setError(result.error)
    }
  }

  async function handleReject() {
    const result = await rejectMatching(matchingId)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-error">{error}</p>}

      <form action={handleAccept}>
        <SubmitButton className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md disabled:opacity-50">
          수락
        </SubmitButton>
      </form>

      <a
        href="https://pf.kakao.com/_placeholder"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full rounded-xl border border-border-light px-4 py-3 text-center text-sm text-text-muted transition-colors hover:bg-surface"
      >
        조건 상의
      </a>

      <form action={handleReject}>
        <SubmitButton className="w-full rounded-xl border border-border-light px-4 py-3 text-sm text-text-muted transition-colors hover:bg-surface disabled:opacity-50">
          거절
        </SubmitButton>
      </form>
    </div>
  )
}
