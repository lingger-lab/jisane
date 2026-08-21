'use client'

import { useState } from 'react'
import { SubmitButton } from './submit-button'
import { CharLimitNotice } from './char-limit-notice'

const MESSAGE_MAX = 1000

const SENDER_LABELS: Record<string, string> = {
  owner: '기업회원',
  expert: '시니어지식인',
  provider: '전문가회원',
  admin: '매니저',
}

export interface OrderMessage {
  id: string
  sender_type: string
  content: string
  created_at: string
}

/**
 * 서비스 주문 3자 메시지 스레드(공용) — 기업회원·전문가회원(공급자)·관리자.
 * deal_message 스레드 패턴을 서비스 주문용으로 일반화: sendAction·selfType을 주입받아
 * owner/provider/admin 화면에서 동일 컴포넌트를 재사용한다. 낙관적 append + 실패 롤백.
 */
export function OrderMessageThread({
  orderId,
  messages: initialMessages,
  selfType,
  sendAction,
}: {
  orderId: string
  messages: OrderMessage[]
  /** 내 발신자 유형(owner|provider|admin) — 우측 정렬·라벨 기준 */
  selfType: string
  sendAction: (orderId: string, content: string) => Promise<{ error?: string }>
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!content.trim()) return
    setError(null)
    const temp: OrderMessage = {
      id: `temp-${Date.now()}`,
      sender_type: selfType,
      content: content.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, temp])
    const saved = content
    setContent('')
    const result = await sendAction(orderId, saved)
    if (result.error) {
      setError(result.error)
      setMessages((prev) => prev.filter((m) => m.id !== temp.id))
      setContent(saved)
    }
  }

  return (
    <div className="rounded-xl border border-border-light p-4 shadow-xs">
      <h3 className="mb-3 text-sm font-semibold text-text">메시지</h3>
      {error && <p className="mb-2 text-xs text-error">{error}</p>}

      {messages.length === 0 ? (
        <p className="mb-3 text-xs text-text-subtle">
          산출물 링크·진행 상황·요청사항을 이곳에서 주고받을 수 있습니다.
        </p>
      ) : (
        <div className="mb-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
          {messages.map((msg) => {
            const isSelf = msg.sender_type === selfType
            return (
              <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    isSelf
                      ? 'bg-accent text-white'
                      : msg.sender_type === 'admin'
                        ? 'bg-info-light text-text'
                        : 'bg-surface text-text'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`mt-1 text-xs ${isSelf ? 'text-white/60' : 'text-text-subtle'}`}>
                    {SENDER_LABELS[msg.sender_type] || msg.sender_type}
                    {' · '}
                    {new Date(msg.created_at).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CharLimitNotice length={content.length} max={MESSAGE_MAX} />
      <form action={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메시지 입력..."
          aria-label="메시지 입력"
          maxLength={MESSAGE_MAX}
          className="flex-1 rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:outline-none"
        />
        <SubmitButton className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50">
          전송
        </SubmitButton>
      </form>
    </div>
  )
}
