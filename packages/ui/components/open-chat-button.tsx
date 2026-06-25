'use client'

export function OpenChatButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('open-chat-widget'))}
      className="text-sm font-medium text-accent underline underline-offset-4"
    >
      지사네 매니저에게 문의하기
    </button>
  )
}
