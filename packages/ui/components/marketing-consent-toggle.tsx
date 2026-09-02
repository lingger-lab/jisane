'use client'

import { useState, useTransition } from 'react'
import { cn } from '../lib/cn'

/**
 * 마케팅 수신 동의 토글 — 마이페이지 '알림·수신 설정'용. 서버액션을 DI로 받는다.
 * 연락처(휴대폰) 미등록이면 비활성 + 안내. 낙관적 갱신 후 실패 시 되돌린다.
 */
export function MarketingConsentToggle({
  defaultEnabled,
  hasPhone,
  action,
}: {
  defaultEnabled: boolean
  hasPhone: boolean
  action: (next: boolean) => Promise<{ ok?: boolean; error?: string }>
}) {
  const [enabled, setEnabled] = useState(defaultEnabled)
  const [pending, startTransition] = useTransition()

  function toggle() {
    if (!hasPhone || pending) return
    const next = !enabled
    setEnabled(next) // 낙관적
    startTransition(async () => {
      const r = await action(next)
      if (r?.error) {
        setEnabled(!next) // 롤백
        alert(r.error)
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border-light bg-surface-warm p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text">마케팅 정보 수신</p>
        <p className="mt-0.5 text-xs text-text-muted">
          {hasPhone
            ? '지사네 소식·혜택을 카카오톡·문자로 받아봅니다. 언제든 끌 수 있어요.'
            : '휴대폰 번호를 먼저 등록하면 설정할 수 있어요.'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="마케팅 정보 수신 동의"
        disabled={!hasPhone || pending}
        onClick={toggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-ring disabled:opacity-40',
          enabled ? 'bg-primary' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}
