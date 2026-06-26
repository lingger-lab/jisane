'use client'

import { useState } from 'react'
import { confirmDeal, requestRevision } from '@/lib/deal/actions'
import { sendDealInquiry } from '@/lib/message/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

interface InspectionSectionProps {
  dealId: string
}

export function InspectionSection({ dealId }: InspectionSectionProps) {
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [revisionError, setRevisionError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [issueText, setIssueText] = useState('')
  const [issueSent, setIssueSent] = useState(false)
  const [issueError, setIssueError] = useState<string | null>(null)

  async function handleConfirm() {
    const result = await confirmDeal(dealId)
    if (result?.error) {
      setConfirmError(result.error)
    }
  }

  async function handleRevision(formData: FormData) {
    const reason = formData.get('reason') as string
    if (!reason?.trim()) {
      setRevisionError('수정 사유를 입력해주세요.')
      return
    }
    const result = await requestRevision(dealId, reason.trim())
    if (result.error) {
      setRevisionError(result.error)
    } else {
      setShowRevisionForm(false)
      setRevisionError(null)
    }
  }

  return (
    <div className="rounded-xl border border-border-light p-4 shadow-xs">
      <h3 className="mb-2 text-sm font-semibold text-text">검수</h3>
      <p className="mb-4 text-xs text-text-muted">
        작업 결과를 확인하고 검수를 진행해주세요. 3일 내 응답이 없으면 자동으로
        검수가 확정됩니다.
      </p>

      <div className="flex flex-col gap-2">
        {confirmError && (
          <p className="text-xs text-error">{confirmError}</p>
        )}
        {/* 검수완료 */}
        <form action={handleConfirm}>
          <SubmitButton className="w-full rounded-xl bg-success px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-success/90 disabled:opacity-50">
            검수완료
          </SubmitButton>
        </form>

        {/* 수정요청 */}
        {!showRevisionForm ? (
          <button
            type="button"
            onClick={() => setShowRevisionForm(true)}
            className="w-full rounded-xl border border-border-light px-4 py-2.5 text-sm text-text-muted transition-colors hover:bg-surface"
          >
            수정요청
          </button>
        ) : (
          <form action={handleRevision} className="flex flex-col gap-2">
            <textarea
              name="reason"
              rows={3}
              required
              placeholder="수정이 필요한 부분을 적어주세요."
              className="w-full resize-none rounded-xl border border-border-light bg-background px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
            />
            {revisionError && (
              <p className="text-xs text-error">{revisionError}</p>
            )}
            <div className="flex gap-2">
              <SubmitButton className="flex-1 rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-warning/90 disabled:opacity-50">
                수정 요청 전송
              </SubmitButton>
              <button
                type="button"
                onClick={() => {
                  setShowRevisionForm(false)
                  setRevisionError(null)
                }}
                className="rounded-xl border border-border-light px-4 py-2 text-sm text-text-muted transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* 문제신고 */}
        {!showIssueForm && !issueSent && (
          <button
            type="button"
            onClick={() => setShowIssueForm(true)}
            className="w-full rounded-xl border border-error/30 px-4 py-2.5 text-center text-sm text-error transition-colors hover:bg-error-light"
          >
            문제신고
          </button>
        )}

        {showIssueForm && !issueSent && (
          <form action={async () => {
            if (!issueText.trim()) { setIssueError('내용을 입력해주세요.'); return }
            setIssueError(null)
            const result = await sendDealInquiry(dealId, issueText.trim(), 'deal_issue')
            if (result.error) {
              setIssueError(result.error)
            } else {
              setIssueSent(true)
              setIssueText('')
            }
          }} className="flex flex-col gap-2">
            <textarea
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              rows={3}
              placeholder="문제 상황을 상세히 적어주세요."
              className="w-full resize-none rounded-xl border border-error/30 bg-background px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-error focus:ring-1 focus:ring-error/20 focus:outline-none transition-colors"
            />
            {issueError && <p className="text-xs text-error">{issueError}</p>}
            <div className="flex gap-2">
              <SubmitButton className="flex-1 rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-error/90 disabled:opacity-50">
                문제신고 전송
              </SubmitButton>
              <button
                type="button"
                onClick={() => { setShowIssueForm(false); setIssueText(''); setIssueError(null) }}
                className="rounded-xl border border-border-light px-4 py-2 text-sm text-text-muted transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {issueSent && (
          <div className="rounded-xl border border-success/20 bg-success-light p-3 text-center">
            <p className="text-sm font-medium text-success">문제신고가 접수되었습니다</p>
            <p className="mt-1 text-xs text-success/70">매니저가 확인 후 조치해드리겠습니다.</p>
            <button
              type="button"
              onClick={() => { setIssueSent(false); setShowIssueForm(true) }}
              className="mt-2 text-xs font-medium text-accent hover:underline"
            >
              추가 신고하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
