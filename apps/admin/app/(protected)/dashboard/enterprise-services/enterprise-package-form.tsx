'use client'

import { useActionState, useState } from 'react'
import { createEnterpriseService, updateEnterpriseService } from '@/lib/enterprise/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import { Input } from '@jisane/ui/input'
import { Select } from '@jisane/ui/select'
import { Textarea } from '@jisane/ui/textarea'
import { useUnsavedGuard } from '@jisane/ui/use-unsaved-guard'
import { PILLAR_ORDER, PILLAR_LABELS } from '@jisane/shared/service-catalog'

export interface EnterprisePackageFormDefaults {
  packageId?: string
  name?: string
  pillar?: string
  description?: string
  valueDesc?: string
  price?: number
  isFree?: boolean
  priceTbd?: boolean
  duration?: string
  deliverables?: string[]
  status?: string
}

const STATUS_OPTIONS = [
  { value: 'published', label: '공개' },
  { value: 'draft', label: '비공개(임시)' },
  { value: 'archived', label: '보관' },
]

export function EnterprisePackageForm({
  defaults = {},
}: {
  defaults?: EnterprisePackageFormDefaults
}) {
  const isEdit = !!defaults.packageId
  const [state, formAction] = useActionState(
    isEdit ? updateEnterpriseService : createEnterpriseService,
    {}
  )
  const [isFree, setIsFree] = useState(defaults.isFree ?? false)
  const [priceTbd, setPriceTbd] = useState(defaults.priceTbd ?? false)
  const [priceDisplay, setPriceDisplay] = useState(
    defaults.price ? defaults.price.toLocaleString('ko-KR') : ''
  )

  const priceLocked = isFree || priceTbd
  const guard = useUnsavedGuard()

  return (
    <form action={formAction} onChange={guard.markDirty} onSubmit={guard.reset} className="flex max-w-xl flex-col gap-5">
      {isEdit && <input type="hidden" name="package_id" value={defaults.packageId} />}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-text">
          서비스명 <span className="text-error">*</span>
        </label>
        <Input id="name" name="name" type="text" required defaultValue={defaults.name} placeholder="예: 생산·품질 공정 진단" />
      </div>

      <div>
        <label htmlFor="pillar" className="mb-1 block text-sm font-medium text-text">
          분류 (5대 지원) <span className="text-error">*</span>
        </label>
        <Select id="pillar" name="pillar" required defaultValue={defaults.pillar ?? ''}>
          <option value="" disabled>선택</option>
          {PILLAR_ORDER.map((code) => (
            <option key={code} value={code}>{PILLAR_LABELS[code]}</option>
          ))}
        </Select>
      </div>

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
        />
      </div>

      <div>
        <label htmlFor="value_desc" className="mb-1 block text-sm font-medium text-text">
          한 줄 가치 설명 <span className="text-xs text-text-subtle">(목록·랜딩 표시)</span>
        </label>
        <Input id="value_desc" name="value_desc" type="text" defaultValue={defaults.valueDesc} placeholder="예: 생산 공정·품질 체계 진단과 개선 자문" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium text-text">
            가격 (원) {!priceLocked && <span className="text-error">*</span>}
          </label>
          <Input
            id="price"
            name="price"
            type="text"
            inputMode="numeric"
            required={!priceLocked}
            value={isFree ? '0' : priceTbd ? '' : priceDisplay}
            disabled={priceLocked}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^0-9]/g, '')
              setPriceDisplay(digits ? Number(digits).toLocaleString('ko-KR') : '')
            }}
            placeholder={priceTbd ? '상담 문의' : '예: 300,000'}
            className="disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="duration" className="mb-1 block text-sm font-medium text-text">
            소요 기간 <span className="text-xs text-text-subtle">(선택)</span>
          </label>
          <Input id="duration" name="duration" type="text" defaultValue={defaults.duration} placeholder="예: 2주" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            name="is_free"
            checked={isFree}
            onChange={(e) => {
              setIsFree(e.target.checked)
              if (e.target.checked) setPriceTbd(false)
            }}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          무료 서비스
        </label>
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            name="price_tbd"
            checked={priceTbd}
            onChange={(e) => {
              setPriceTbd(e.target.checked)
              if (e.target.checked) setIsFree(false)
            }}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          가격 미정 — 목록에 &ldquo;상담 문의&rdquo;로 표시 (가격정책 확정 전)
        </label>
      </div>

      <div>
        <label htmlFor="deliverables" className="mb-1 block text-sm font-medium text-text">
          제공 내용 <span className="text-xs text-text-subtle">(한 줄에 하나씩)</span>
        </label>
        <Textarea
          id="deliverables"
          name="deliverables"
          rows={4}
          defaultValue={(defaults.deliverables || []).join('\n')}
          placeholder={'진단 리포트\n개선 로드맵'}
        />
      </div>

      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium text-text">
          공개 상태
        </label>
        <Select id="status" name="status" defaultValue={defaults.status ?? 'published'}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {!isEdit && (
        <div>
          <label htmlFor="slug" className="mb-1 block text-sm font-medium text-text">
            URL 주소(slug) <span className="text-xs text-text-subtle">(선택 — 영문, 비우면 자동 생성)</span>
          </label>
          <Input id="slug" name="slug" type="text" placeholder="예: quality-process-consulting" />
        </div>
      )}

      {state.error && <p className="text-sm text-error" role="alert" aria-live="polite">{state.error}</p>}

      <SubmitButton variant="primary" className="self-start rounded-xl px-6 py-3 font-semibold shadow-sm hover:shadow-md">
        {isEdit ? '저장하기' : '등록하기'}
      </SubmitButton>
    </form>
  )
}
