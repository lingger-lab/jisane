'use client'

import { useActionState, useState } from 'react'
import { CircleCheck } from 'lucide-react'
import { SubmitButton } from './submit-button'
import { FreeConsultNote } from './free-consult-note'
import { cn } from '../lib/cn'

export interface InquiryActionState {
  ok?: boolean
  error?: string
}

/** 010-1234-5678 형태로 가벼운 자동 하이픈(입력 편의 — 서버가 다시 정규화하므로 표시용). */
function formatPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length < 4) return d
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

/**
 * 상담문의 접수 공용 폼 — owner/expert/공개허브 3곳 공용. 서버액션을 DI로 받아 UI 패키지가
 * 서버에 직접 의존하지 않는다(banner-uploader와 동형). 이름·연락처(필수) + 내용(선택) +
 * 개인정보 필수동의 + 마케팅 선택동의 + 허니팟. 제출 성공 시 확인 UI로 교체.
 */
export function ConsultInquiryForm({
  action,
  isLoggedIn = false,
  defaultName = '',
  defaultPhone = '',
  privacyUrl,
  joinUrl,
  tone = 'primary',
}: {
  action: (prev: InquiryActionState, formData: FormData) => Promise<InquiryActionState>
  isLoggedIn?: boolean
  defaultName?: string
  defaultPhone?: string
  /** 개인정보처리방침 '자세히' 링크(크로스앱 절대 URL). 없으면 링크 미표시 */
  privacyUrl?: string
  /** 비로그인 성공 후 회원가입 유도 URL(선택) */
  joinUrl?: string
  tone?: 'primary' | 'accent'
}) {
  const [state, formAction] = useActionState(action, {})
  const [phone, setPhone] = useState(defaultPhone)
  const accent = tone === 'accent' ? 'text-accent' : 'text-primary'

  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border-light bg-surface-warm p-6 text-center">
        <CircleCheck className="h-8 w-8 text-success" aria-hidden="true" />
        <div>
          <p className="text-base font-semibold text-text">상담 문의가 접수되었습니다</p>
          <p className="mt-1 text-sm text-text-muted">담당 매니저가 1영업일 내 연락드립니다 · 상담은 무료입니다</p>
        </div>
        {!isLoggedIn && joinUrl && (
          <a
            href={joinUrl}
            className="mt-1 inline-flex items-center rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
          >
            회원가입하고 진행 상황 보기
          </a>
        )}
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* 허니팟 — 화면·스크린리더에서 숨김, 봇만 채움. autocomplete off */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">이 항목은 비워두세요</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-text">
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={40}
          defaultValue={defaultName}
          placeholder="성함을 입력해주세요"
          className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-text">
          휴대폰 번호
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          required
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="010-0000-0000"
          className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
        />
        {isLoggedIn && (defaultName || defaultPhone) && (
          <p className="mt-1 text-xs text-text-subtle">프로필 정보를 미리 채웠어요 · 수정할 수 있습니다</p>
        )}
      </div>

      <div>
        <label htmlFor="detail" className="mb-1 block text-sm font-medium text-text">
          문의 내용 <span className="text-xs text-text-subtle">(선택)</span>
        </label>
        <textarea
          id="detail"
          name="detail"
          rows={3}
          placeholder="궁금한 점이나 요청사항을 적어주세요."
          className="w-full resize-none rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
        />
      </div>

      {/* 결정지점 — 동의 직전에 '무료' 재확인 */}
      <FreeConsultNote variant="inline" className="justify-center" />

      {/* 동의 — 필수/선택 분리 */}
      <div className="flex flex-col gap-2 rounded-xl border border-border-light bg-surface-warm p-3">
        <label htmlFor="privacy_consent" className="flex items-start gap-2 text-sm text-text">
          <input
            id="privacy_consent"
            name="privacy_consent"
            type="checkbox"
            required
            className={cn('mt-0.5 h-4 w-4 shrink-0 rounded border-border-light', accent)}
          />
          <span>
            <span className="font-medium">[필수]</span> 개인정보 수집·이용 동의{' '}
            <span className="text-text-subtle">— 상담 응대를 위해 이름·연락처를 수집합니다.</span>
            {privacyUrl && (
              <>
                {' '}
                <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className={cn('underline', accent)}>
                  자세히
                </a>
              </>
            )}
          </span>
        </label>
        <label htmlFor="marketing_consent" className="flex items-start gap-2 text-sm text-text">
          <input
            id="marketing_consent"
            name="marketing_consent"
            type="checkbox"
            className={cn('mt-0.5 h-4 w-4 shrink-0 rounded border-border-light', accent)}
          />
          <span>
            <span className="font-medium">[선택]</span> 마케팅 정보 수신 동의{' '}
            <span className="text-text-subtle">— 지사네 소식·혜택을 카카오톡·문자로 받아봅니다. 언제든 철회할 수 있어요.</span>
          </span>
        </label>
      </div>

      {state.error && (
        <p className="text-sm text-error" role="alert" aria-live="polite">
          {state.error}
        </p>
      )}

      <SubmitButton
        variant={tone === 'accent' ? 'accent' : 'primary'}
        className="rounded-xl px-6 py-3 font-semibold shadow-sm hover:shadow-md"
      >
        상담 문의하기
      </SubmitButton>
    </form>
  )
}
