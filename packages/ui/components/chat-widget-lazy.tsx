'use client'

import { useState, useEffect, type ComponentProps } from 'react'
import { ChatWidget } from './chat-widget'

// 클라이언트에서만 렌더링하여 hydration mismatch 방지.
// 서버 컴포넌트(layout.tsx)에서 ChatWidget 대신 사용.
export function ChatWidgetLazy(props: ComponentProps<typeof ChatWidget>) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <ChatWidget {...props} />
}
