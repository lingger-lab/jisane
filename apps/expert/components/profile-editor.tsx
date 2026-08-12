'use client'

import { useActionState, useRef, useState } from 'react'
import { updateExpertProfile } from '@/lib/expert/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
// 등록 페이지와 동일한 단일 소스 — 축약 목록을 쓰면 저장값이 고아가 됨(감사 docs/11 P1-6)
import { FIELD_GROUPS } from '@/lib/fields'

const CAREER_OPTIONS = [
  { value: '', label: '선택 안함' },
  { value: '3', label: '1~5년' },
  { value: '7', label: '5~10년' },
  { value: '15', label: '10년 이상' },
] as const

interface ExpertProfile {
  name: string | null
  field: string | null
  career_years: number | null
  hourly_rate: number | null
  contact: string | null
  email: string
  grade: string
  created_at: string
}

export function ProfileEditor({ profile }: { profile: ExpertProfile }) {
  const [state, formAction] = useActionState(updateExpertProfile, {})
  const [selectedFields, setSelectedFields] = useState<string[]>(
    profile.field ? profile.field.split(',') : []
  )
  // 상한 도달·필수 미선택은 조작 지점에서 즉시 안내 — 무반응/서버 왕복 에러만 있던 문제(감사 docs/10 P3-48·P3-49)
  const [capReached, setCapReached] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const fieldsetRef = useRef<HTMLFieldSetElement>(null)

  function toggleField(chip: string) {
    const isSelected = selectedFields.includes(chip)
    if (!isSelected && selectedFields.length >= 5) {
      // 6번째 칩 탭이 조용히 무시되지 않도록 상한 안내를 띄운다
      setCapReached(true)
      return
    }
    setCapReached(false)
    setFieldError(null) // 수정이 시작되면 검증 에러 해제
    setSelectedFields(
      isSelected ? selectedFields.filter((f) => f !== chip) : [...selectedFields, chip]
    )
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        // 필수 칩그룹은 제출 전에 클라이언트에서 검증 — 서버 왕복 후 하단 에러만 보이던 문제(감사 docs/10 P3-49)
        if (selectedFields.length === 0) {
          e.preventDefault()
          setFieldError('전문 분야를 1개 이상 선택해주세요.')
          fieldsetRef.current?.scrollIntoView({ block: 'center' })
        }
      }}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="redirect_to" value="/mypage" />
      {/* 전문 분야 — fieldset/legend로 칩그룹에 그룹 이름 부여 (감사 docs/10 P3-50) */}
      <fieldset ref={fieldsetRef}>
        <legend className="mb-2 block text-sm font-medium text-text">
          전문 분야 <span className="text-error">*</span>
          <span className="ml-1 text-xs font-normal text-text-muted">(최대 5개)</span>
        </legend>
        <div className="flex flex-col gap-3">
          {FIELD_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-xs font-semibold text-text-muted">{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.fields.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleField(chip)}
                    aria-pressed={selectedFields.includes(chip)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selectedFields.includes(chip)
                        ? 'border-accent bg-accent/10 font-semibold text-accent'
                        : 'border-border-light text-text-muted hover:border-accent/30'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {capReached && (
          <p role="status" aria-live="polite" className="mt-2 text-xs font-medium text-warning">
            최대 5개까지 선택할 수 있어요. 다른 분야를 선택하려면 먼저 하나를 해제해주세요.
          </p>
        )}
        {fieldError && (
          <p role="alert" aria-live="polite" className="mt-2 text-sm text-error">
            {fieldError}
          </p>
        )}
        <input type="hidden" name="field" value={selectedFields.join(',')} />
      </fieldset>

      {/* 경력 */}
      <div>
        <label htmlFor="career_years" className="mb-1 block text-sm font-medium text-text">
          경력 <span className="text-xs text-text-subtle">(선택)</span>
        </label>
        <select
          id="career_years"
          name="career_years"
          defaultValue={profile.career_years?.toString() || ''}
          className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
        >
          {CAREER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 시간당 단가 */}
      <div>
        <label htmlFor="hourly_rate" className="mb-1 block text-sm font-medium text-text">
          시간당 단가 <span className="text-xs text-text-subtle">(선택)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            id="hourly_rate"
            name="hourly_rate"
            type="number"
            min={10000}
            max={100000}
            step={5000}
            defaultValue={profile.hourly_rate || 25000}
            className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
          />
          <span className="shrink-0 text-sm text-text-muted">원/시간</span>
        </div>
        <p className="mt-1 text-xs text-text-subtle">10,000원 ~ 100,000원 (기준 25,000원)</p>
      </div>

      {/* 이름 */}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-text">
          이름 <span className="text-xs text-text-subtle">(선택)</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={profile.name || ''}
          placeholder="본명 또는 활동명"
          className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
        />
      </div>

      {/* 연락처 */}
      <div>
        <label htmlFor="contact" className="mb-1 block text-sm font-medium text-text">
          연락처 <span className="text-xs text-text-subtle">(선택, 비공개)</span>
        </label>
        <input
          id="contact"
          name="contact"
          type="tel"
          defaultValue={profile.contact || ''}
          placeholder="전화번호 또는 이메일"
          className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
        />
      </div>

      {/* 에러 */}
      {state.error && (
        <p className="text-sm text-error" role="alert" aria-live="polite">{state.error}</p>
      )}

      {/* 제출 */}
      <SubmitButton className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md disabled:opacity-50">
        프로필 수정
      </SubmitButton>
    </form>
  )
}
