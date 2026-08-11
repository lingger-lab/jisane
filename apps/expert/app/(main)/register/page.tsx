'use client'

import { useActionState, useState } from 'react'
import { updateExpertProfile } from '@/lib/expert/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
// 대분류별 중분류 그룹 (category 테이블과 동기) — 편집기와 공유하는 단일 소스
import { FIELD_GROUPS } from '@/lib/fields'

const CAREER_OPTIONS = [
  { value: '', label: '선택 안함' },
  { value: '3', label: '1~5년' },
  { value: '7', label: '5~10년' },
  { value: '15', label: '10년 이상' },
] as const

export default function RegisterPage() {
  const [state, formAction] = useActionState(updateExpertProfile, {})
  const [selectedFields, setSelectedFields] = useState<string[]>([])

  function toggleField(chip: string) {
    setSelectedFields((prev) =>
      prev.includes(chip)
        ? prev.filter((f) => f !== chip)
        : prev.length < 5
          ? [...prev, chip]
          : prev
    )
  }

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      {/* 다크 히어로 — 브랜드 딥그린 밴드 (렐라랩 벤치마킹) */}
      <div className="hero-dark w-full">
        <section className="responsive-container flex flex-col items-center gap-2 px-4 md:px-6 pt-10 md:pt-14 pb-8 md:pb-10 text-center">
          <span className="hero-eyebrow">시니어지식인공간 · 등록</span>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-white leading-snug">
            경험의 값어치, <span className="text-accent-light">온전히</span> 받으세요
          </h1>
          <p className="text-sm md:text-base text-white/75">전문 분야를 등록하면 맞춤 의뢰가 연결됩니다.</p>
        </section>
      </div>

      <div className="responsive-container px-4 md:px-6 py-6">
      {/* 작업료 0% 수수료 강조 */}
      <div className="mb-6 rounded-xl border border-accent/20 bg-surface-warm p-4 text-center shadow-sm">
        <p className="text-lg font-bold text-accent">작업료 0% 수수료</p>
        <p className="mt-1 text-xs text-text-muted">
          시니어지식인님이 받는 작업료에서 수수료를 떼지 않습니다.
        </p>
      </div>

      <form
        action={formAction}
        className="flex flex-col gap-5"
      >
        {/* 전문 분야 — fieldset/legend로 칩그룹에 그룹 이름 부여 (감사 docs/10 P3-50과 동일 패턴) */}
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-text">
            전문 분야 <span className="text-error">*</span>
            <span className="ml-1 text-xs font-normal text-text-muted">(최대 5개)</span>
          </legend>
          <div className="space-y-3">
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
          <p className="mt-2 text-xs text-text-subtle">
            선택: {selectedFields.length}/5개
          </p>
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
              defaultValue={25000}
              className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
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
          <input
            id="name"
            name="name"
            type="text"
            placeholder="본명 또는 활동명"
            className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
          />
        </div>

        {/* 연락처 (선택) */}
        <div>
          <label htmlFor="contact" className="mb-1 block text-sm font-medium text-text">
            연락처 <span className="text-xs text-text-subtle">(선택, 비공개)</span>
          </label>
          <input
            id="contact"
            name="contact"
            type="tel"
            placeholder="전화번호 또는 이메일"
            className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
          />
        </div>

        {/* 에러 */}
        {state.error && (
          <p className="text-sm text-error">{state.error}</p>
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
