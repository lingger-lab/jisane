'use client'

import { useActionState, useState } from 'react'
import { createServicePackage, updateServicePackage } from '@/lib/partner/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import { Input } from '@jisane/ui/input'
import { Select } from '@jisane/ui/select'
import { Textarea } from '@jisane/ui/textarea'

export interface PackageFormDefaults {
  packageId?: string
  name?: string
  category?: string
  targetAudience?: string
  description?: string
  valueDesc?: string
  price?: number
  isFree?: boolean
  duration?: string
  deliverables?: string[]
}

export function PackageForm({ defaults = {} }: { defaults?: PackageFormDefaults }) {
  const isEdit = !!defaults.packageId
  const [state, formAction] = useActionState(
    isEdit ? updateServicePackage : createServicePackage,
    {}
  )
  const [isFree, setIsFree] = useState(defaults.isFree ?? false)
  const [priceDisplay, setPriceDisplay] = useState(
    defaults.price ? defaults.price.toLocaleString('ko-KR') : ''
  )

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      {isEdit && <input type="hidden" name="package_id" value={defaults.packageId} />}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-text">
          서비스명 <span className="text-error">*</span>
        </label>
        <Input id="name" name="name" type="text" required defaultValue={defaults.name} placeholder="예: AI 도입 진단" tone="info" />
      </div>

      {!isEdit && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="category" className="mb-1 block text-sm font-medium text-text">
              카테고리 <span className="text-error">*</span>
            </label>
            <Select id="category" name="category" required defaultValue={defaults.category ?? ''} tone="info">
              <option value="" disabled>선택</option>
              <option value="ax_consulting">AX 컨설팅</option>
              <option value="biz_consulting">경영 컨설팅</option>
              <option value="education">교육</option>
            </Select>
          </div>
          <div>
            <label htmlFor="target_audience" className="mb-1 block text-sm font-medium text-text">
              제공 대상 <span className="text-error">*</span>
            </label>
            <Select id="target_audience" name="target_audience" required defaultValue={defaults.targetAudience ?? ''} tone="info">
              <option value="" disabled>선택</option>
              <option value="owner">기업회원</option>
              <option value="expert">시니어지식인회원</option>
            </Select>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-text">
          서비스 설명 <span className="text-error">*</span>
        </label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          required
          defaultValue={defaults.description}
          placeholder="무엇을, 어떻게 제공하는지 구체적으로 적어주세요."
          tone="info"
        />
      </div>

      <div>
        <label htmlFor="value_desc" className="mb-1 block text-sm font-medium text-text">
          한 줄 가치 설명 <span className="text-xs text-text-subtle">(목록 카드에 표시)</span>
        </label>
        <Input id="value_desc" name="value_desc" type="text" defaultValue={defaults.valueDesc} placeholder="예: 데이터 기반 의사결정 진단" tone="info" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium text-text">
            가격 (원) {!isFree && <span className="text-error">*</span>}
          </label>
          <Input
            id="price"
            name="price"
            type="text"
            inputMode="numeric"
            // 유료면 다른 필수 필드처럼 제출 전 인라인 검증 — 서버 왕복 후에야 알던 문제(감사 docs/10 P3-25)
            required={!isFree}
            value={isFree ? '0' : priceDisplay}
            disabled={isFree}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^0-9]/g, '')
              setPriceDisplay(digits ? Number(digits).toLocaleString('ko-KR') : '')
            }}
            placeholder="예: 300,000"
            tone="info"
            className="disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="duration" className="mb-1 block text-sm font-medium text-text">
            소요 기간 <span className="text-xs text-text-subtle">(선택)</span>
          </label>
          <Input id="duration" name="duration" type="text" defaultValue={defaults.duration} placeholder="예: 1주" tone="info" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          name="is_free"
          checked={isFree}
          onChange={(e) => setIsFree(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-info"
        />
        무료 서비스 (S/W·P/G 무료 제공 등)
      </label>

      <div>
        <label htmlFor="deliverables" className="mb-1 block text-sm font-medium text-text">
          제공 내용 <span className="text-xs text-text-subtle">(한 줄에 하나씩)</span>
        </label>
        <Textarea
          id="deliverables"
          name="deliverables"
          rows={4}
          defaultValue={(defaults.deliverables || []).join('\n')}
          placeholder={'진단 리포트\n실행 로드맵\n수료증'}
          tone="info"
        />
      </div>

      {state.error && <p className="text-sm text-error" role="alert" aria-live="polite">{state.error}</p>}

      <div className="flex items-center gap-3">
        <SubmitButton className="rounded-xl bg-info-solid px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-info-solid/90 hover:shadow-md disabled:opacity-50">
          {isEdit ? '저장하기' : '등록하기 (검수 후 공개)'}
        </SubmitButton>
      </div>
    </form>
  )
}
