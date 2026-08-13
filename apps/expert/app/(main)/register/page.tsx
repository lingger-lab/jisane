'use client'

import { useActionState, useRef, useState } from 'react'
import { updateExpertProfile } from '@/lib/expert/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import { Input } from '@jisane/ui/input'
import { Select } from '@jisane/ui/select'
// 대분류별 중분류 그룹 (category 테이블과 동기) — 편집기와 공유하는 단일 소스
import { FIELD_LIST } from '@/lib/fields'

const CAREER_OPTIONS = [
  { value: '', label: '선택 안함' },
  { value: '3', label: '1~5년' },
  { value: '7', label: '5~10년' },
  { value: '15', label: '10년 이상' },
] as const

export default function RegisterPage() {
  const [state, formAction] = useActionState(updateExpertProfile, {})
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  // 상한 도달·필수 미선택은 조작 지점에서 즉시 안내 — 무반응/서버 왕복 에러만 있던 문제(감사 docs/10 P3-42·P3-43)
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
    <div className="flex flex-1 flex-col animate-fade-in">
      {/* 다크 히어로 — 브랜드 딥그린 밴드 (렐라랩 벤치마킹) */}
      <div className="hero-dark w-full">
        <section className="container-form flex flex-col items-center gap-2 px-4 md:px-6 pt-10 md:pt-14 pb-8 md:pb-10 text-center">
          <span className="hero-eyebrow">시니어지식인공간 · 등록</span>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-white leading-snug">
            경험의 값어치, <span className="text-accent-light">온전히</span> 받으세요
          </h1>
          <p className="text-sm md:text-base text-white/75">전문 분야를 등록하면 맞춤 의뢰가 연결됩니다.</p>
        </section>
      </div>

      <div className="container-form px-4 md:px-6 py-6">
      {/* 작업료 0% 수수료 강조 */}
      <div className="mb-6 rounded-xl border border-accent/20 bg-surface-warm p-4 text-center shadow-sm">
        <p className="text-lg font-bold text-accent">작업료 0% 수수료</p>
        <p className="mt-1 text-xs text-text-muted">
          시니어지식인님이 받는 작업료에서 수수료를 떼지 않습니다.
        </p>
      </div>

      <form
        action={formAction}
        onSubmit={(e) => {
          // 필수 칩그룹은 제출 전에 클라이언트에서 검증 — 서버 왕복 후 하단 에러만 보이던 문제(감사 docs/10 P3-43)
          if (selectedFields.length === 0) {
            e.preventDefault()
            setFieldError('전문 분야를 1개 이상 선택해주세요.')
            fieldsetRef.current?.scrollIntoView({ block: 'center' })
          }
        }}
        className="flex flex-col gap-5"
      >
        {/* 전문 분야 — fieldset/legend로 칩그룹에 그룹 이름 부여 (감사 docs/10 P3-50과 동일 패턴) */}
        <fieldset ref={fieldsetRef}>
          <legend className="mb-2 block text-sm font-medium text-text">
            전문 분야 <span className="text-error">*</span>
            <span className="ml-1 text-xs font-normal text-text-muted">(최대 5개)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {FIELD_LIST.map((chip) => (
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
          <p className="mt-2 text-xs text-text-subtle">
            선택: {selectedFields.length}/5개
          </p>
          {capReached && (
            <p role="status" aria-live="polite" className="mt-1 text-xs font-medium text-warning">
              최대 5개까지 선택할 수 있어요. 다른 분야를 선택하려면 먼저 하나를 해제해주세요.
            </p>
          )}
          {fieldError && (
            <p role="alert" aria-live="polite" className="mt-1 text-sm text-error">
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
          <Select id="career_years" name="career_years" tone="accent">
            {CAREER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        {/* 시간당 단가 */}
        <div>
          <label htmlFor="hourly_rate" className="mb-1 block text-sm font-medium text-text">
            시간당 단가 <span className="text-xs text-text-subtle">(선택)</span>
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="hourly_rate"
              name="hourly_rate"
              type="number"
              min={10000}
              max={100000}
              step={5000}
              defaultValue={25000}
              tone="accent"
            />
            <span className="shrink-0 text-sm text-text-muted">원/시간</span>
          </div>
          <p className="mt-1 text-xs text-text-subtle">10,000원 ~ 100,000원 (기준 25,000원)</p>
        </div>

        {/* 이름 (선택) */}
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-text">
            이름 <span className="text-xs text-text-subtle">(선택)</span>
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="본명 또는 활동명"
            tone="accent"
          />
        </div>

        {/* 연락처 (선택) */}
        <div>
          <label htmlFor="contact" className="mb-1 block text-sm font-medium text-text">
            연락처 <span className="text-xs text-text-subtle">(선택, 비공개)</span>
          </label>
          <Input
            id="contact"
            name="contact"
            type="tel"
            placeholder="전화번호 또는 이메일"
            tone="accent"
          />
        </div>

        {/* 에러 — role=alert로 낭독 (D2 패턴, 감사 docs/10 P3-49) */}
        {state.error && (
          <p className="text-sm text-error" role="alert" aria-live="polite">{state.error}</p>
        )}

        {/* 제출 */}
        <SubmitButton className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md disabled:opacity-50">
          시니어지식인 등록 완료
        </SubmitButton>
      </form>
      </div>
    </div>
  )
}
