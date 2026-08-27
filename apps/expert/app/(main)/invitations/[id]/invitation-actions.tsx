'use client'

import { useState, useActionState } from 'react'
import { Button } from '@jisane/ui/button'
import { acceptInvitation, declineInvitation } from '@/lib/invitation/actions'

interface InvitationActionsProps {
  invitationId: string
  hourlyRate: number
}

export function InvitationActions({ invitationId, hourlyRate }: InvitationActionsProps) {
  const [estHours, setEstHours] = useState('')
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [declineError, setDeclineError] = useState<string | null>(null)

  const [acceptState, acceptAction, isAccepting] = useActionState(acceptInvitation, {})

  const estAmount = estHours ? hourlyRate * parseInt(estHours, 10) : 0

  async function handleDecline() {
    setDeclining(true)
    setDeclineError(null)
    // 성공 시 서버 액션이 redirect하므로 반환은 에러 경로에서만 온다
    // ('접근 권한이 없습니다'·'이미 처리된 초빙입니다' — 동시 처리 race 등).
    // 에러를 표시하고 버튼을 되살려, 영구 '거절 중...' 고착을 막는다(감사 docs/10 P1-4).
    const result = await declineInvitation(invitationId)
    if (result?.error) {
      setDeclineError(result.error)
      setDeclining(false)
    }
  }

  return (
    <section className="mt-6 flex flex-col gap-4">
      {/* 예상 시간 입력 */}
      <div className="rounded-xl border border-border-light bg-background p-4 shadow-sm">
        <h2 className="text-sm font-bold text-text">수락 정보 입력</h2>
        <p className="mt-1 text-xs text-text-muted">
          예상 작업 시간을 입력하면 캡 금액이 자동 계산됩니다.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm text-text-muted" htmlFor="est_hours">예상 시간</label>
          <input
            id="est_hours"
            type="number"
            min="1"
            max="200"
            value={estHours}
            onChange={(e) => setEstHours(e.target.value)}
            placeholder="시간"
            className="w-24 rounded-lg border border-border-light px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <span className="text-xs text-text-subtle">시간</span>
        </div>
        {estAmount > 0 && (
          <div className="mt-3 rounded-lg bg-accent/5 p-3 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>시간당 단가</span>
              <span>{hourlyRate.toLocaleString('ko-KR')}원</span>
            </div>
            <div className="mt-1 flex justify-between font-bold text-accent">
              <span>캡 금액 (예상액)</span>
              <span>{estAmount.toLocaleString('ko-KR')}원</span>
            </div>
          </div>
        )}
      </div>

      {/* 수락 버튼 */}
      <form action={acceptAction}>
        <input type="hidden" name="invitation_id" value={invitationId} />
        <input type="hidden" name="est_hours" value={estHours} />
        <Button
          type="submit"
          variant="accent"
          disabled={isAccepting || !estHours || parseInt(estHours, 10) < 1}
          className="h-12 w-full font-semibold shadow-sm"
        >
          {isAccepting ? '수락 처리 중...' : '초빙 수락'}
        </Button>
        {acceptState.error && (
          <p className="mt-2 text-center text-xs text-error">{acceptState.error}</p>
        )}
      </form>

      {/* 거절 버튼 */}
      {!showDeclineConfirm ? (
        <Button type="button" variant="outline" onClick={() => setShowDeclineConfirm(true)} className="h-10 w-full">
          거절하기
        </Button>
      ) : (
        <div className="rounded-xl border border-error/20 bg-error/5 p-4">
          <p className="text-sm text-text">정말 이 초빙을 거절하시겠습니까?</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="danger" size="sm" onClick={handleDecline} disabled={declining} className="flex-1">
              {declining ? '거절 중...' : '거절 확인'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowDeclineConfirm(false)} className="flex-1">
              취소
            </Button>
          </div>
          {declineError && (
            <p className="mt-2 text-center text-xs text-error" role="alert">{declineError}</p>
          )}
        </div>
      )}
    </section>
  )
}
