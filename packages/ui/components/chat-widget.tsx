'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'bot'
  text: string
  escalated?: boolean
}

const QUICK_QUESTIONS = [
  '수수료가 어떻게 되나요?',
  '선입금은 안전한가요?',
  '일 맡기기는 어떻게 하나요?',
  '시니어 등록은 어떻게 하나요?',
  '지사네는 어떤 서비스인가요?',
]

const KAKAO_CHANNEL_URL = 'https://pf.kakao.com/_placeholder' // TODO: 실제 채널 URL로 교체

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 외부에서 챗봇 열기 (커스텀 이벤트)
  useEffect(() => {
    function handleOpen() { setIsOpen(true) }
    window.addEventListener('open-chat-widget', handleOpen)
    return () => window.removeEventListener('open-chat-widget', handleOpen)
  }, [])

  async function sendMessage(question: string) {
    if (!question.trim()) return

    const userMsg: Message = { role: 'user', text: question }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })

      const data = await res.json()

      const botMsg: Message = {
        role: 'bot',
        text: data.answer || '죄송합니다. 일시적인 오류가 발생했습니다.',
        escalated: data.escalated || false,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      ])
    }

    setLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* 플로팅 버블 */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full shadow-float transition-all hover:scale-105 hover:shadow-lg sm:bottom-6 overflow-hidden"
          aria-label="지사네 매니저 채팅 열기"
        >
          {/* A: 네이비 배경 / B: 라이트 배경 — 교체 시 src만 변경 */}
          <img
            src="/chat-icon-a.png"
            alt="지사네 매니저"
            className="h-full w-full object-cover"
          />
        </button>
      )}

      {/* 챗 패널 */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="지사네 매니저 채팅"
          className="fixed bottom-0 right-0 z-50 flex h-[28rem] sm:h-[32rem] w-full flex-col rounded-t-2xl border border-border-light bg-background shadow-float sm:bottom-6 sm:right-4 sm:w-96 sm:rounded-2xl animate-scale-in"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between rounded-t-2xl bg-primary px-4 py-3 sm:rounded-t-2xl">
            <div>
              <p className="text-sm font-bold text-white">지사네 매니저</p>
              <p className="text-xs text-white/70">무엇이든 물어보세요</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto px-4 py-3" aria-live="polite">
            {messages.length === 0 && (
              <div>
                <p className="mb-3 text-sm text-text-muted">자주 묻는 질문</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="rounded-full border border-border-light px-3 py-1.5 text-xs text-text hover:bg-surface-warm transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-surface text-text shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.escalated && (
                    <a
                      href={KAKAO_CHANNEL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block rounded-lg bg-warning px-3 py-1.5 text-xs font-medium text-white hover:bg-warning/90 transition-colors"
                    >
                      카카오톡으로 상담하기
                    </a>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="mb-3 flex justify-start">
                <div className="rounded-2xl bg-surface px-4 py-2 text-sm text-text-muted shadow-xs">
                  답변 작성 중...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <form onSubmit={handleSubmit} className="border-t border-border-light px-4 py-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="질문을 입력하세요..."
                aria-label="질문 입력"
                className="flex-1 rounded-full border border-border-light bg-surface px-4 py-2 text-sm text-text placeholder:text-text-subtle focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 btn-press transition-colors"
              >
                전송
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
