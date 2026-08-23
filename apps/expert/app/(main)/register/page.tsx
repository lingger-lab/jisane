'use client'

import { useActionState } from 'react'
import { updateExpertProfile } from '@/lib/expert/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import { Input } from '@jisane/ui/input'
import { Select } from '@jisane/ui/select'
import { HeroBackdrop } from '@jisane/ui/hero-backdrop'
// 전문 분야 칩 로직·UI는 편집기와 공유하는 단일 소스로 추출
import { useFieldChips, FieldChips } from '@/components/field-chips'

const CAREER_OPTIONS = [
  { value: '', label: '선택 안함' },
  { value: '3', label: '1~5년' },
  { value: '7', label: '5~10년' },
  { value: '15', label: '10년 이상' },
] as const

export default function RegisterPage() {
  const [state, formAction] = useActionState(updateExpertProfile, {})
  const chips = useFieldChips([])

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      {/* 다크 히어로 — 브랜드 딥그린 밴드 (렐라랩 벤치마킹) */}
      <div className="hero-dark w-full">
        <HeroBackdrop intensity="subtle" />
        <section className="container-form relative z-10 flex flex-col items-center gap-2 px-4 md:px-6 pt-10 md:pt-14 pb-8 md:pb-10 text-center">
          <span className="hero-eyebrow animate-slide-up stagger-1">시니어지식인공간 · 등록</span>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-white leading-snug animate-slide-up stagger-2">
            경험의 값어치, <span className="text-accent-light">온전히</span> 받으세요
          </h1>
          <p className="text-sm md:text-base text-white/75 animate-slide-up stagger-3">전문 분야를 등록하면 맞춤 의뢰가 연결됩니다.</p>
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
        // 필수 칩그룹은 제출 전에 클라이언트에서 검증 — 서버 왕복 후 하단 에러만 보이던 문제(감사 docs/10 P3-43)
        onSubmit={(e) => chips.validate(e)}
        className="flex flex-col gap-5"
      >
        <FieldChips chips={chips} showCounter />

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

        {/* 실명 (필수, 비공개) */}
        <div>
          <label htmlFor="real_name" className="mb-1 block text-sm font-medium text-text">
            실명 <span className="text-error">*</span>
            <span className="ml-1 text-xs text-text-subtle">(비공개, 관리용)</span>
          </label>
          <Input
            id="real_name"
            name="real_name"
            type="text"
            required
            placeholder="주민등록상 실명"
            tone="accent"
          />
          <p className="mt-1 text-xs text-text-subtle">외부에 공개되지 않으며, 지사네 관리자만 확인합니다.</p>
        </div>

        {/* 활동명 (선택, 공개 표시명) */}
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-text">
            활동명 <span className="text-xs text-text-subtle">(공개, 선택)</span>
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="목록·프로필에 표시될 이름"
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
        <SubmitButton variant="accent" className="rounded-xl px-6 py-3 font-semibold shadow-sm hover:shadow-md">
          시니어지식인 등록 완료
        </SubmitButton>
      </form>
      </div>
    </div>
  )
}
