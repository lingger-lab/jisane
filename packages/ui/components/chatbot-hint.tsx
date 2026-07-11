'use client'

import { useState, useEffect, useCallback } from 'react'

const DEFAULT_SUGGESTIONS = [
  '지사네는 어떤 서비스인가요?',
  '수수료는 얼마인가요?',
  '매칭은 어떻게 진행되나요?',
]

export function ChatBotHint({
  suggestions = DEFAULT_SUGGESTIONS,
}: {
  suggestions?: string[]
}) {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 2500)
    const hideTimer = setTimeout(() => {
      setFading(true)
      setTimeout(() => setVisible(false), 400)
    }, 12000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  const dismiss = useCallback(() => {
    setFading(true)
    setTimeout(() => setVisible(false), 400)
  }, [])

  const openChatbot = useCallback(() => {
    const btn = document.querySelector<HTMLButtonElement>(
      'button[aria-label="채팅 열기"]',
    )
    if (btn) btn.click()
    dismiss()
  }, [dismiss])

  if (!visible) return null

  return (
    <div
      className="chatbot-hint"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <p
        role="button"
        tabIndex={0}
        onClick={openChatbot}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openChatbot() }}
        aria-label="챗봇 열기"
        className="chatbot-hint-title"
      >
        궁금한 점이 있으시면 물어보세요
      </p>

      <div className="chatbot-hint-chips">
        {suggestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={openChatbot}
            className="chatbot-hint-chip"
          >
            {q}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={dismiss}
        className="chatbot-hint-close"
        aria-label="힌트 닫기"
      >
        &times;
      </button>

      <div className="chatbot-hint-arrow" />
    </div>
  )
}
