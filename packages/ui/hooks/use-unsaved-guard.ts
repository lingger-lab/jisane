'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * 편집 폼 이탈 가드 — 변경 후 저장하지 않고 새로고침·탭닫기·주소이동 시 브라우저 경고.
 * 비제어 폼에 form-level onChange로 dirty를 올리고, 제출 시 reset해 저장 후 경고를 막는다.
 * beforeunload는 브라우저 레벨 이탈(새로고침·닫기·외부이동)을 커버한다.
 *
 * 사용:
 *   const guard = useUnsavedGuard()
 *   <form action={formAction} onChange={guard.markDirty} onSubmit={guard.reset}>
 */
export function useUnsavedGuard() {
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // 일부 브라우저는 returnValue 설정을 요구(문구는 브라우저가 표준 메시지로 대체).
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const markDirty = useCallback(() => setDirty(true), [])
  const reset = useCallback(() => setDirty(false), [])

  return { dirty, markDirty, reset }
}
