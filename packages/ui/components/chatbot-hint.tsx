'use client'

import { useState, useEffect } from 'react'

export function ChatBotHint() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 2500)
    const hideTimer = setTimeout(() => {
      setFading(true)
      setTimeout(() => setVisible(false), 400)
    }, 8000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  function dismiss() {
    setFading(true)
    setTimeout(() => setVisible(false), 400)
  }

  return (
    <div
      onClick={dismiss}
      className="chatbot-hint"
      style={{
        opacity: fading ? 0 : 1,
      }}
    >
      궁금한 점이 있으시면 물어보세요
      <div className="chatbot-hint-arrow" />
    </div>
  )
}
