'use client'

import { useRef, useState, type FormEvent } from 'react'
// 전문 분야 = 평면 12분류 (category 테이블과 동기) — register·profile-editor 공유 단일 소스
import { FIELD_LIST } from '@/lib/fields'

/**
 * 전문 분야 칩 선택 로직 — register·profile-editor 중복 제거(단일 소스).
 * 상한 5·즉시 안내·필수 검증·스크롤 포커스 동작을 그대로 보존한다(감사 docs/10 P3-42~50).
 */
export function useFieldChips(initial: string[] = []) {
  const [selectedFields, setSelectedFields] = useState<string[]>(initial)
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
    setSelectedFields(isSelected ? selectedFields.filter((f) => f !== chip) : [...selectedFields, chip])
  }

  /** 제출 전 필수 검증 — 미선택 시 preventDefault + 에러 표시 + 스크롤. 반환 true=통과 */
  function validate(e: FormEvent): boolean {
    if (selectedFields.length === 0) {
      e.preventDefault()
      setFieldError('전문 분야를 1개 이상 선택해주세요.')
      fieldsetRef.current?.scrollIntoView({ block: 'center' })
      return false
    }
    return true
  }

  return { selectedFields, capReached, fieldError, fieldsetRef, toggleField, validate }
}

type FieldChipsState = ReturnType<typeof useFieldChips>

/**
 * 전문 분야 칩 그룹 UI — fieldset/legend로 그룹 이름 부여(접근성), 상한/에러 안내, hidden input(name="field").
 * showCounter로 "선택: n/5개" 카운터 노출(등록 폼에서 사용).
 */
export function FieldChips({
  chips,
  showCounter = false,
  onToggle,
}: {
  chips: FieldChipsState
  showCounter?: boolean
  /** 칩 선택 변경 시 호출 — 폼 change 이벤트를 안 내는 버튼 토글을 dirty로 잡기 위함 */
  onToggle?: () => void
}) {
  const { selectedFields, capReached, fieldError, fieldsetRef, toggleField } = chips
  return (
    <fieldset ref={fieldsetRef}>
      <legend className="mb-2 block text-sm font-medium text-text">
        전문 분야 <span className="text-error">*</span>
        <span className="ml-1 text-xs font-normal text-text-muted">(최대 5개)</span>
      </legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {FIELD_LIST.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => { toggleField(chip); onToggle?.() }}
            aria-pressed={selectedFields.includes(chip)}
            className={`rounded-lg border px-2 py-2 text-xs text-center leading-tight break-keep transition-colors ${
              selectedFields.includes(chip)
                ? 'border-accent bg-accent/10 font-semibold text-accent'
                : 'border-border-light text-text-muted hover:border-accent/30'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>
      {showCounter && <p className="mt-2 text-xs text-text-subtle">선택: {selectedFields.length}/5개</p>}
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
  )
}
