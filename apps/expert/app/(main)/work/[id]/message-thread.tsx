'use client'

import { useState } from 'react'
import { sendDealMessage } from '@/lib/message/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

interface Message {
  id: string
  sender_type: string
  content: string
  created_at: string
}

export function MessageThread({
  dealId,
  messages: initialMessages,
}: {
  dealId: string
  messages: Message[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!content.trim()) return
    setError(null)

    // 낙관적 업데이트
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      sender_type: 'expert',
      content: content.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])
    const savedContent = content
    setContent('')

    const result = await sendDealMessage(dealId, savedContent)
    if (result.error) {
      setError(result.error)
      // 롤백
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      setContent(savedContent)
    }
  }

  return (
    <div className="rounded-xl border border-border-light p-4 shadow-xs">
      <h3 className="mb-3 text-sm font-semibold text-text">메시지</h3>

      {error && <p className="mb-2 text-xs text-error">{error}</p>}

      {messages.length === 0 ? (
        <p className="mb-3 text-xs text-text-subtle">
          매니저에게 질문이나 진행 상황을 공유할 수 있습니다.
        </p>
      ) : (
        <div className="mb-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'expert' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  msg.sender_type === 'expert'
                    ? 'bg-accent text-white'
                    : 'bg-surface text-text'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`mt-1 text-xs ${
                  msg.sender_type === 'expert' ? 'text-white/60' : 'text-text-subtle'
                }`}>
                  {msg.sender_type === 'admin' ? '매니저' : '나'}
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

      <form action={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메시지 입력..."
          aria-label="메시지 입력"
          maxLength={1000}
          className="flex-1 rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-accent focus:outline-none"
        />
        <SubmitButton
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
        >
          전송
        </SubmitButton>
      </form>
    </div>
  )
}
