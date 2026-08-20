'use client'

import { useEffect, useRef, useState } from 'react'
import { OwlIcon } from '@jisane/ui/icons/owl'
import { resolveTrapKey } from '@jisane/ui/focus-trap'

export function SplashOverlay() {
  // 허브 메인 진입 시마다 표시 (반복 노출 — 브랜드 인상 목적, 세션 제한 없음)
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // 모달 시맨틱(WCAG 2.1.2): 열리면 포커스를 유일한 포커서블(시작하기)로 이동.
  // 자동 표시 오버레이라 복귀할 트리거가 없다 — 닫히면 문서 처음부터 탐색한다.
  // + 스플래시가 떠 있는 동안 이벤트 팝업과 겹치지 않도록 전역 플래그를 세운다(EventPopup이 참조).
  useEffect(() => {
    buttonRef.current?.focus()
    ;(window as Window & { __jisaneSplashActive?: boolean }).__jisaneSplashActive = true
  }, [])

  if (!visible) return null

  function handleEnter() {
    if (fading) return
    setFading(true)
    setTimeout(() => {
      setVisible(false)
      // 스플래시 종료를 EventPopup에 알려 그때 팝업을 노출시킨다.
      ;(window as Window & { __jisaneSplashActive?: boolean }).__jisaneSplashActive = false
      window.dispatchEvent(new Event('jisane:splash-closed'))
    }, 500)
  }

  // Tab은 오버레이 안에서 순환(포커서블 1개 = 제자리), Esc는 '시작하기'와 동일하게 닫는다.
  function handleKeyDown(e: React.KeyboardEvent) {
    const focusables = buttonRef.current ? [buttonRef.current] : []
    const active = focusables.indexOf(document.activeElement as HTMLButtonElement)
    const result = resolveTrapKey(e.key, e.shiftKey, active, focusables.length)
    if (result.type === 'close') {
      e.preventDefault()
      handleEnter()
    } else if (result.type === 'focus') {
      e.preventDefault()
      focusables[result.index]?.focus()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="지사네 시작 화면"
      onKeyDown={handleKeyDown}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--background)' }}
      className={`flex flex-col items-center justify-center transition-all duration-500 ${
        fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex flex-col items-center px-6 text-center">
        {/* 아이콘 — 드롭 바운스 등장 → 주기적 점프(squash&stretch) + 깜빡임 + 발밑 그림자 */}
        <div className="splash-owl-stage relative">
          <div className="splash-owl-drop">
            <div className="splash-owl-hop">
              <OwlIcon className="h-20 w-20 md:h-24 md:w-24 text-primary splash-owl owl-alive" />
            </div>
          </div>
          <div className="splash-owl-shadow" aria-hidden="true" />
        </div>

        {/* 브랜드명 — 스태거 입장, 부엉이 착지 시 글자별 찌그러짐 파동 */}
        <div className="mt-6 splash-stagger-1">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight" aria-label="지사네">
            {['지', '사', '네'].map((ch, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`inline-block text-brand-gradient splash-char splash-char-${i + 1}`}
              >
                {ch}
              </span>
            ))}
          </h2>
        </div>

        {/* 태그라인 */}
        <div className="mt-3 splash-stagger-2">
          <p className="text-lg md:text-xl font-semibold text-text">지식나눔 사업협력 네트워크</p>
        </div>

        {/* 구분선 — 가로 확장 애니메이션 */}
        <div className="mt-4 splash-stagger-3">
          <div className="splash-line mx-auto h-px w-12 bg-border" />
        </div>

        {/* 서브카피 */}
        <div className="mt-4 splash-stagger-4">
          <p className="text-sm md:text-base text-text-muted">
            중소기업 전문 서비스 · 시니어 전문가 정보
          </p>
        </div>

        {/* CTA 버튼 — pulse glow */}
        <div className="mt-8 splash-stagger-5">
          <button
            ref={buttonRef}
            type="button"
            onClick={handleEnter}
            className="rounded-xl bg-primary px-10 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-primary-light hover:shadow-lg hover:-translate-y-0.5 btn-press"
          >
            시작하기 &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
