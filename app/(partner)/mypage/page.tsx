'use client'

import { useActionState, useState, useEffect } from 'react'
import { updatePartnerProfile } from '@/lib/partner/actions'
import { SubmitButton } from '@/components/submit-button'
import { SuccessToast } from '@/components/toast'

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

export default function MyPage() {
  const [state, formAction] = useActionState(updatePartnerProfile, {})
  const [profile, setProfile] = useState<PartnerProfile | null>(null)
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    fetch('/api/partner/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.partner) {
          setProfile(data.partner)
          setSelectedFields(data.partner.field ? data.partner.field.split(',') : [])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-text-muted">로딩 중...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-text-muted">프로필 정보를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <SuccessToast />
      <h1 className="mb-2 text-2xl font-bold text-accent">마이페이지</h1>
      <p className="mb-6 text-sm text-text-muted">
        내 프로필을 확인하고 수정할 수 있습니다.
      </p>

      {/* 프로필 요약 카드 */}
      <div className="mb-6 rounded-xl border border-border-light bg-surface-warm p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-lg font-bold text-accent">
            {(profile.name || profile.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-text">{profile.name || '이름 미등록'}</p>
            <p className="text-xs text-text-muted">{profile.email}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-3 text-xs text-text-muted">
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-medium text-accent">{profile.grade === 'gold' ? '골드' : '스탠다드'}</span>
          <span>가입: {new Date(profile.created_at).toLocaleDateString('ko-KR')}</span>
        </div>
      </div>

      <form
        action={formAction}
        className="flex flex-col gap-5"
      >
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
    </div>
  )
}
