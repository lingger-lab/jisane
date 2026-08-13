'use client'

import { useActionState } from 'react'
import { updateExpertProfile } from '@/lib/expert/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import { Input } from '@jisane/ui/input'
import { Select } from '@jisane/ui/select'
// 전문 분야 칩 로직·UI는 등록 페이지와 공유하는 단일 소스로 추출
import { useFieldChips, FieldChips } from '@/components/field-chips'

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
  const chips = useFieldChips(profile.field ? profile.field.split(',') : [])

  return (
    <form
      action={formAction}
      // 필수 칩그룹은 제출 전에 클라이언트에서 검증 — 서버 왕복 후 하단 에러만 보이던 문제(감사 docs/10 P3-49)
      onSubmit={(e) => chips.validate(e)}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="redirect_to" value="/mypage" />
      <FieldChips chips={chips} />

      {/* 경력 */}
      <div>
        <label htmlFor="career_years" className="mb-1 block text-sm font-medium text-text">
          경력 <span className="text-xs text-text-subtle">(선택)</span>
        </label>
        <Select
          id="career_years"
          name="career_years"
          defaultValue={profile.career_years?.toString() || ''}
          tone="accent"
        >
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
            defaultValue={profile.hourly_rate || 25000}
            tone="accent"
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
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={profile.name || ''}
          placeholder="본명 또는 활동명"
          tone="accent"
        />
      </div>

      {/* 연락처 */}
      <div>
        <label htmlFor="contact" className="mb-1 block text-sm font-medium text-text">
          연락처 <span className="text-xs text-text-subtle">(선택, 비공개)</span>
        </label>
        <Input
          id="contact"
          name="contact"
          type="tel"
          defaultValue={profile.contact || ''}
          placeholder="전화번호 또는 이메일"
          tone="accent"
        />
      </div>

      {/* 에러 */}
      {state.error && (
        <p className="text-sm text-error" role="alert" aria-live="polite">{state.error}</p>
      )}

      {/* 제출 */}
      <SubmitButton variant="accent" className="rounded-xl px-6 py-3 font-semibold shadow-sm hover:shadow-md">
        프로필 수정
      </SubmitButton>
    </form>
  )
}
