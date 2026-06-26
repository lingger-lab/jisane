'use client'

import { useState } from 'react'
import Link from 'next/link'
import { WorkflowChecklist } from '@jisane/ui/workflow-checklist'
import { getMessagesForDeal } from '@/lib/admin/actions'
import { sendAdminMessage } from '@/lib/admin/message-actions'
import type { DealWorkflowRow } from '@jisane/shared/types'

interface DealItem {
  id: string
  work_fee: number
  match_fee: number
  total_pay: number
  status: string
  created_at: string
  request: { id: string; title: string; req_type: string | null }
  partner: { id: string; name: string | null; field: string | null }
}

interface Message {
  id: string
  sender_type: string
  sender_id: string
  content: string
  created_at: string
}

const SENDER_LABELS: Record<string, string> = {
  client: '기업',
  partner: '시니어',
  admin: '매니저',
}

const SENDER_COLORS: Record<string, string> = {
  client: 'bg-accent text-white',
  partner: 'bg-surface text-text',
  admin: 'bg-info-light text-text',
}

export function ProgressTab({
  deals,
  workflows,
  messageCounts = {},
}: {
  deals: DealItem[]
  workflows: DealWorkflowRow[]
  messageCounts?: Record<string, number>
}) {
  const [expandedMsgId, setExpandedMsgId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyError, setReplyError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleToggleMessages(dealId: string) {
    if (expandedMsgId === dealId) {
      setExpandedMsgId(null)
      return
    }
    setMsgLoading(true)
    setExpandedMsgId(dealId)
    setReplyText('')
    setReplyError(null)
    const result = await getMessagesForDeal(dealId)
    setMessages(result.messages as Message[])
    setMsgLoading(false)
  }

  async function handleSendReply(dealId: string) {
    if (!replyText.trim()) return
    setSending(true)
    setReplyError(null)

    const result = await sendAdminMessage(dealId, replyText.trim())
    if (result.error) {
      setReplyError(result.error)
    } else {
      // 낙관적 업데이트
      setMessages((prev) => [...prev, {
        id: `temp-${Date.now()}`,
        sender_type: 'admin',
        sender_id: '',
        content: replyText.trim(),
        created_at: new Date().toISOString(),
      }])
      setReplyText('')
    }
    setSending(false)
  }

  if (deals.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">진행 중인 거래가 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {deals.map((deal) => {
        const steps = workflows.filter((w) => w.deal_id === deal.id)
        const allDone = steps.length === 5 && steps.every((s) => s.status === 'done')
        const msgCount = messageCounts[deal.id] || 0

        return (
          <div key={deal.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-text">{deal.request.title}</h3>
                <div className="mt-1 flex gap-2 text-xs text-text-muted">
                  <span>파트너: {deal.partner.name || '이름 미등록'}</span>
                  <span>·</span>
                  <span>{deal.partner.field}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-accent">
                  {deal.total_pay.toLocaleString('ko-KR')}원
                </p>
                <p className="text-xs text-text-muted">
                  작업비 {deal.work_fee.toLocaleString('ko-KR')} + 매칭피 {deal.match_fee.toLocaleString('ko-KR')}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <WorkflowChecklist steps={steps} />
            </div>

            {/* 메시지 배지 + 토글 */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleMessages(deal.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  expandedMsgId === deal.id
                    ? 'bg-accent text-white'
                    : 'border border-border-light text-text-muted hover:bg-surface'
                }`}
              >
                {expandedMsgId === deal.id ? '메시지 닫기' : '메시지 보기'}
                {msgCount > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                    expandedMsgId === deal.id
                      ? 'bg-white/20 text-white'
                      : 'bg-accent/10 text-accent'
                  }`}>
                    {msgCount}
                  </span>
                )}
              </button>
            </div>

            {/* 펼침 메시지 스레드 */}
            {expandedMsgId === deal.id && (
              <div className="mt-3 border-t border-border pt-3">
                {msgLoading ? (
                  <p className="text-sm text-text-muted">메시지 로딩 중...</p>
                ) : messages.length === 0 ? (
                  <p className="mb-2 text-xs text-text-subtle">아직 메시지가 없습니다.</p>
                ) : (
                  <div className="mb-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                            SENDER_COLORS[msg.sender_type] || 'bg-surface text-text'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className={`mt-1 text-xs ${
                            msg.sender_type === 'admin' ? 'text-info/60' : 'text-text-subtle'
                          }`}>
                            {SENDER_LABELS[msg.sender_type] || msg.sender_type}
                            {' · '}
                            {new Date(msg.created_at).toLocaleString('ko-KR', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 관리자 답변 입력 */}
                {replyError && <p className="mb-2 text-xs text-error">{replyError}</p>}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="관리자 답변 입력..."
                    maxLength={1000}
                    className="flex-1 rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-accent focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendReply(deal.id)
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSendReply(deal.id)}
                    disabled={sending || !replyText.trim()}
                    className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                  >
                    전송
                  </button>
                </div>
              </div>
            )}

            {allDone && (
              <div className="mt-3 flex items-center justify-between rounded-md bg-success-light p-2">
                <span className="text-xs font-medium text-success">모든 단계 완료</span>
                <Link
                  href={`/review-input/${deal.id}`}
                  className="rounded bg-success px-3 py-1 text-xs font-medium text-white hover:bg-success/90"
                >
                  리뷰 입력
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
