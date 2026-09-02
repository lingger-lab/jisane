'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { composeAdMessage, type MessageChannel } from '@jisane/shared/messaging/compose'
import { createCampaign, sendCampaign } from '@/lib/messaging/actions'

export interface Campaign {
  id: string
  title: string
  channel: MessageChannel
  body: string
  status: string
  scheduled_at: string | null
  target_count: number
  sent_count: number
  failed_count: number
  created_at: string
}

const CHANNEL_LABEL: Record<MessageChannel, string> = { friendtalk: '카카오 친구톡', lms: '문자(LMS)' }
const STATUS_LABEL: Record<string, string> = {
  draft: '작성', scheduled: '예약', sending: '발송중', done: '완료', failed: '실패', canceled: '취소',
}

export function MessagingConsole({
  configured,
  consentCount,
  campaigns,
  unsubHint,
}: {
  configured: boolean
  consentCount: number
  campaigns: Campaign[]
  unsubHint: string
}) {
  const router = useRouter()
  const [state, formAction] = useActionState(createCampaign, {} as { ok?: boolean; error?: string })
  const [pending, startTransition] = useTransition()
  const [channel, setChannel] = useState<MessageChannel>('friendtalk')
  const [body, setBody] = useState('')

  const preview = body.trim()
    ? composeAdMessage(body, channel, channel === 'lms' ? unsubHint || '080-000-0000' : '카카오톡 채널 차단')
    : ''

  function send(id: string) {
    startTransition(async () => {
      const r = await sendCampaign(id)
      if (r?.error) alert(r.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 구성 상태 */}
      {!configured && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
          발송 채널이 아직 준비 중입니다 — 카카오 비즈니스 채널·발신프로필·대행사(Solapi) 키가 설정되면 발송이 활성화됩니다.
          그 전까지 캠페인은 <strong>작성·저장만</strong> 가능하고 실제 발송은 되지 않습니다.
        </div>
      )}

      {/* 세그먼트 */}
      <div className="rounded-xl border border-border-light bg-surface-warm p-4">
        <p className="text-sm text-text-muted">마케팅 수신 동의자(발송 대상)</p>
        <p className="mt-1 text-2xl font-bold text-primary tabular-nums">{consentCount.toLocaleString('ko-KR')}명</p>
        <p className="mt-1 text-xs text-text-subtle">상담문의 접수 시 마케팅 수신에 동의한 연락처. 동의자 외에는 발송 대상에서 자동 제외됩니다.</p>
      </div>

      {/* 캠페인 작성 */}
      <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-border-light bg-card p-4 shadow-xs">
        <h2 className="text-base font-bold text-text">새 캠페인</h2>
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-text">제목</label>
          <input id="title" name="title" type="text" required maxLength={60}
            className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label htmlFor="channel" className="mb-1 block text-sm font-medium text-text">채널</label>
          <select id="channel" name="channel" value={channel} onChange={(e) => setChannel(e.target.value as MessageChannel)}
            className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none">
            <option value="friendtalk">카카오 친구톡 (채널 친구 대상)</option>
            <option value="lms">문자(LMS) — 친구톡 미도달 보완</option>
          </select>
        </div>
        <div>
          <label htmlFor="body" className="mb-1 block text-sm font-medium text-text">본문</label>
          <textarea id="body" name="body" required rows={4} value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="회원에게 전할 내용을 입력하세요. (광고)·수신거부 문구는 발송 시 자동으로 붙습니다."
            className="w-full resize-none rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label htmlFor="scheduled_at" className="mb-1 block text-sm font-medium text-text">
            예약 발송 <span className="text-xs text-text-subtle">(선택 · 비우면 즉시발송 대상)</span>
          </label>
          <input id="scheduled_at" name="scheduled_at" type="datetime-local"
            className="rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
          <p className="mt-1 text-xs text-text-subtle">광고성 정보는 21시~08시 발송이 금지됩니다(발송 시 검증).</p>
        </div>

        {/* 규정 준수 프리뷰 — (광고)·수신거부 자동 삽입 결과 */}
        {preview && (
          <div className="rounded-lg border border-dashed border-border-light bg-surface p-3">
            <p className="mb-1 text-xs font-medium text-text-subtle">실제 발송 미리보기 (자동 삽입 포함)</p>
            <p className="whitespace-pre-wrap text-sm text-text">{preview}</p>
          </div>
        )}

        {state.error && <p className="text-sm text-error">{state.error}</p>}
        {state.ok && <p className="text-sm text-success">캠페인을 저장했습니다.</p>}
        <button type="submit"
          className="focus-ring self-start rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light">
          캠페인 저장
        </button>
      </form>

      {/* 발송 이력 */}
      <div>
        <h2 className="mb-3 text-base font-bold text-text">캠페인 이력</h2>
        {campaigns.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-light py-8 text-center text-sm text-text-muted">아직 캠페인이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {campaigns.map((c) => (
              <li key={c.id} className="rounded-xl border border-border-light bg-card p-4 shadow-xs">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-text">{c.title}</span>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">{CHANNEL_LABEL[c.channel]}</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{STATUS_LABEL[c.status] ?? c.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-text-muted tabular-nums">
                      대상 {c.target_count}명 · 성공 {c.sent_count} · 실패 {c.failed_count}
                      {c.scheduled_at ? ` · 예약 ${new Date(c.scheduled_at).toLocaleString('ko-KR')}` : ''}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-text-muted">{c.body}</p>
                  </div>
                  <button
                    type="button"
                    disabled={!configured || pending || c.status === 'done' || c.status === 'sending'}
                    onClick={() => send(c.id)}
                    className="focus-ring shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
                    title={!configured ? '발송 채널 미구성' : undefined}
                  >
                    지금 발송
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
