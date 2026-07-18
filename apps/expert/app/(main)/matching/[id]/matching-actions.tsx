'use client'

import { useState } from 'react'
import { acceptMatching, rejectMatching } from '@/lib/matching/actions'
import { sendMatchingInquiry } from '@/lib/message/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

interface MatchingActionsProps {
  matchingId: string
}

export function MatchingActions({ matchingId }: MatchingActionsProps) {
  const [error, setError] = useState<string | null>(null)
  const [showInquiry, setShowInquiry] = useState(false)
  const [inquiryText, setInquiryText] = useState('')
  const [inquirySent, setInquirySent] = useState(false)

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

  async function handleSendInquiry() {
    if (!inquiryText.trim()) return
    setError(null)
    const result = await sendMatchingInquiry(matchingId, inquiryText)
    if (result.error) {
      setError(result.error)
    } else {
      setInquirySent(true)
      setInquiryText('')
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

      {/* 조건 상의 — 인앱 메시지 */}
      {inquirySent ? (
        <div className="rounded-xl border border-success/30 bg-success-light p-4 text-center">
          <p className="text-sm font-medium text-success">메시지가 전송되었습니다</p>
          <p className="mt-1 text-xs text-success/80">매니저가 확인 후 연락드립니다.</p>
          <button
            type="button"
            onClick={() => setInquirySent(false)}
            className="mt-2 text-xs text-text-muted hover:text-text"
          >
            추가 메시지 보내기
          </button>
        </div>
      ) : showInquiry ? (
        <div className="rounded-xl border border-border-light p-4">
          <p className="mb-2 text-xs font-medium text-text-muted">조건 상의 메시지</p>
          <textarea
            value={inquiryText}
            onChange={(e) => setInquiryText(e.target.value)}
            placeholder="궁금한 점이나 조건을 입력해주세요"
            rows={3}
            className="mb-2 w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-accent focus:outline-none"
          />
          <div className="flex gap-2">
            <form action={handleSendInquiry} className="flex-1">
              <SubmitButton className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50">
                전송
              </SubmitButton>
            </form>
            <button
              type="button"
              onClick={() => { setShowInquiry(false); setInquiryText('') }}
              className="rounded-lg border border-border-light px-4 py-2 text-sm text-text-muted hover:bg-surface"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInquiry(true)}
          className="w-full rounded-xl border border-border-light px-4 py-3 text-sm text-text-muted transition-colors hover:bg-surface"
        >
          조건 상의
        </button>
      )}

      <form action={handleReject}>
        <SubmitButton className="w-full rounded-xl border border-border-light px-4 py-3 text-sm text-text-muted transition-colors hover:bg-surface disabled:opacity-50">
          거절
        </SubmitButton>
      </form>
    </div>
  )
}
