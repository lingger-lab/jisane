'use client'

import { useState } from 'react'
import { sendOwnerMessage } from '@/lib/message/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

interface Message {
  id: string
  sender_type: string
  content: string
  created_at: string
}

const SENDER_LABELS: Record<string, string> = {
  owner: '나',
  expert: '전문가',
  admin: '매니저',
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
      sender_type: 'owner',
      content: content.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])
    const savedContent = content
    setContent('')

    const result = await sendOwnerMessage(dealId, savedContent)
    if (result.error) {
      setError(result.error)
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
          전문가나 매니저에게 질문이나 요청사항을 전달할 수 있습니다.
        </p>
      ) : (
        <div className="mb-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'owner' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  msg.sender_type === 'owner'
                    ? 'bg-accent text-white'
                    : msg.sender_type === 'admin'
                    ? 'bg-info-light text-text'
                    : 'bg-surface text-text'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`mt-1 text-xs ${
                  msg.sender_type === 'owner' ? 'text-white/60' : 'text-text-subtle'
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

      <form action={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메시지 입력..."
          maxLength={1000}
          className="flex-1 rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:outline-none"
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
