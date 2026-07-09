'use client'

import { useActionState, useState } from 'react'
import { updatePartnerProfile } from '@/lib/partner/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

const FIELD_CHIPS = [
  '창업코칭',
  '정부자금·보조금',
  '사업계획서',
  'AEO최적화',
  'AI진단',
  '디자인',
  '웹개발',
  '영상제작',
  '마케팅',
  '세무·회계',
  '법무',
  '노무',
  '기타',
] as const

const CAREER_OPTIONS = [
  { value: '', label: '선택 안함' },
  { value: '3', label: '1~5년' },
  { value: '7', label: '5~10년' },
  { value: '15', label: '10년 이상' },
] as const

interface PartnerProfile {
  name: string | null
  field: string | null
  career_yrs: number | null
  contact: string | null
  email: string
  grade: string
  created_at: string
}

export function ProfileEditor({ profile }: { profile: PartnerProfile }) {
  const [state, formAction] = useActionState(updatePartnerProfile, {})
  const [selectedFields, setSelectedFields] = useState<string[]>(
    profile.field ? profile.field.split(',') : []
  )

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
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="redirect_to" value="/mypage" />
      {/* 전문 분야 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text">
          전문 분야 <span className="text-error">*</span>
          <span className="ml-1 text-xs font-normal text-text-muted">(최대 5개)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {FIELD_CHIPS.map((chip) => (
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
        <input type="hidden" name="field" value={selectedFields.join(',')} />
      </div>

      {/* 경력 */}
      <div>
        <label htmlFor="career_yrs" className="mb-1 block text-sm font-medium text-text">
          경력 <span className="text-xs text-text-subtle">(선택)</span>
        </label>
        <select
          id="career_yrs"
          name="career_yrs"
          defaultValue={profile.career_yrs?.toString() || ''}
          className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
        >
          {CAREER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
        <p className="text-sm text-error">{state.error}</p>
      )}

      {/* 제출 */}
      <SubmitButton className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md disabled:opacity-50">
        프로필 수정
      </SubmitButton>
    </form>
  )
}
