'use client'

import { useActionState, useState } from 'react'
import { createServiceFor, updateServiceFor, requestBannerUploadFor } from '@/lib/studio/actions'
import { classifyPillar } from '@/lib/studio/classify-pillar'
import { JISANE_OFFICIAL_ID, PILLAR_ORDER, PILLAR_LABELS } from '@jisane/shared/service-catalog'
import { SubmitButton } from '@jisane/ui/submit-button'
import { Input } from '@jisane/ui/input'
import { Select } from '@jisane/ui/select'
import { Textarea } from '@jisane/ui/textarea'
import { BannerUploader } from '@jisane/ui/banner-uploader'

export interface StudioProviderOption {
  id: string
  name: string
  kind: string
  status: string
}

export interface StudioFormDefaults {
  packageId?: string
  providerId?: string
  name?: string
  category?: string
  targetAudience?: string
  description?: string
  valueDesc?: string
  price?: number
  isFree?: boolean
  priceTbd?: boolean
  duration?: string
  deliverables?: string[]
  bannerUrl?: string | null
  status?: string
  pillar?: string | null
  visible?: boolean
}

export function StudioPackageForm({
  defaults = {},
  providers,
}: {
  defaults?: StudioFormDefaults
  providers: StudioProviderOption[]
}) {
  const isEdit = !!defaults.packageId
  const [state, formAction] = useActionState(isEdit ? updateServiceFor : createServiceFor, {})
  const [providerId, setProviderId] = useState(defaults.providerId ?? JISANE_OFFICIAL_ID)
  const [isFree, setIsFree] = useState(defaults.isFree ?? false)
  const [priceTbd, setPriceTbd] = useState(defaults.priceTbd ?? false)
  const [pillar, setPillar] = useState(defaults.pillar ?? '')
  const [pillarTouched, setPillarTouched] = useState(!!defaults.pillar)
  const [visible, setVisible] = useState(defaults.visible ?? true)
  const priceLocked = isFree || priceTbd

  const memberProviders = providers.filter((p) => p.id !== JISANE_OFFICIAL_ID)

  // 제목·설명으로 5대 pillar 자동 제안(신규 등록·미수정 상태에서만). 관리자가 바꾸면 고정.
  function suggestPillar(form: HTMLFormElement | null) {
    if (!form || pillarTouched || isEdit) return
    const nm = (form.elements.namedItem('name') as HTMLInputElement | null)?.value?.trim() ?? ''
    const desc = (form.elements.namedItem('description') as HTMLTextAreaElement | null)?.value ?? ''
    if (nm) setPillar(classifyPillar(nm, desc, null))
  }

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      {isEdit && <input type="hidden" name="package_id" value={defaults.packageId} />}
      {/* disabled select는 폼 제출에서 빠지므로(제공자 변경 불가), 편집 시 provider_id를 hidden으로 함께 보낸다 */}
      {isEdit && <input type="hidden" name="provider_id" value={providerId} />}

      <div>
        <label htmlFor="provider_id" className="mb-1 block text-sm font-medium text-text">
          제공자 <span className="text-error">*</span>
        </label>
        <Select
          id="provider_id"
          name="provider_id"
          required
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          disabled={isEdit}
        >
          <optgroup label="플랫폼">
            <option value={JISANE_OFFICIAL_ID}>지사네 공식 (자체 서비스)</option>
          </optgroup>
          {memberProviders.length > 0 && (
            <optgroup label="회원 (대리등록 · 승인 무관)">
              {memberProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.kind === 'senior' ? '시니어지식인' : '전문가회원'}
                  {p.status !== 'active' ? ` (${p.status})` : ''}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
        <p className="mt-1 text-xs text-text-subtle">
          계정 미연결 회원은 아래 &lsquo;새 제공자 만들기&rsquo;로 먼저 생성하세요. 등록 후 제공자는 변경할 수 없습니다.
        </p>
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-text">
          서비스명 <span className="text-error">*</span>
        </label>
        <Input id="name" name="name" type="text" required defaultValue={defaults.name} placeholder="예: AI 도입 진단" onBlur={(e) => suggestPillar(e.currentTarget.form)} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-text">배너 이미지</label>
        <BannerUploader
          name="banner_url"
          defaultValue={defaults.bannerUrl ?? null}
          requestUpload={() => requestBannerUploadFor(providerId)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-text">
            카테고리 <span className="text-error">*</span>
          </label>
          <Select id="category" name="category" required defaultValue={defaults.category ?? ''}>
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
          <Select id="target_audience" name="target_audience" required defaultValue={defaults.targetAudience ?? ''}>
            <option value="" disabled>선택</option>
            <option value="owner">기업회원</option>
            <option value="expert">시니어지식인회원</option>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="value_desc" className="mb-1 block text-sm font-medium text-text">한 줄 가치 설명</label>
        <Input id="value_desc" name="value_desc" type="text" defaultValue={defaults.valueDesc} placeholder="예: 2주 만에 AX 로드맵 완성" />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-text">
          서비스 설명 <span className="text-error">*</span>
        </label>
        <Textarea id="description" name="description" required rows={4} defaultValue={defaults.description} onBlur={(e) => suggestPillar(e.currentTarget.form)} />
      </div>

      <div>
        <label htmlFor="pillar" className="mb-1 block text-sm font-medium text-text">
          5대 지원 매칭 <span className="text-xs text-text-subtle">(오너 화면 분류 · 선택)</span>
        </label>
        <Select id="pillar" name="pillar" value={pillar} onChange={(e) => { setPillar(e.target.value); setPillarTouched(true) }}>
          <option value="">미매칭</option>
          {PILLAR_ORDER.map((code) => (
            <option key={code} value={code}>{PILLAR_LABELS[code]}</option>
          ))}
        </Select>
        {!pillarTouched && pillar && (
          <p className="mt-1 text-xs text-text-subtle">제목·설명으로 자동 제안됨 — 필요시 변경하세요.</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-text">가격</label>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            name="price"
            type="text"
            inputMode="numeric"
            disabled={priceLocked}
            defaultValue={defaults.price ? defaults.price.toLocaleString('ko-KR') : ''}
            placeholder="원"
            className="w-40"
          />
          <label className="inline-flex items-center gap-1.5 text-sm text-text-muted">
            <input type="checkbox" name="is_free" checked={isFree} onChange={(e) => { setIsFree(e.target.checked); if (e.target.checked) setPriceTbd(false) }} />
            무료
          </label>
          <label className="inline-flex items-center gap-1.5 text-sm text-text-muted">
            <input type="checkbox" name="price_tbd" checked={priceTbd} onChange={(e) => { setPriceTbd(e.target.checked); if (e.target.checked) setIsFree(false) }} />
            상담 문의
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="duration" className="mb-1 block text-sm font-medium text-text">기간</label>
        <Input id="duration" name="duration" type="text" defaultValue={defaults.duration} placeholder="예: 2주" />
      </div>

      <div>
        <label htmlFor="deliverables" className="mb-1 block text-sm font-medium text-text">산출물 (줄바꿈 구분)</label>
        <Textarea id="deliverables" name="deliverables" rows={3} defaultValue={defaults.deliverables?.join('\n')} placeholder={'진단 리포트\n실행 로드맵'} />
      </div>

      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium text-text">상태</label>
        <Select id="status" name="status" defaultValue={defaults.status ?? 'published'}>
          <option value="published">공개 (즉시)</option>
          <option value="draft">비공개 (임시)</option>
          <option value="archived">보관</option>
        </Select>
        <p className="mt-1 text-xs text-text-subtle">관리자 등록은 검수 없이 즉시 반영됩니다.</p>
      </div>

      <div>
        <label className="inline-flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="visible" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
          오너 화면·공개 허브에 노출
        </label>
      </div>

      {state.error && <p className="text-sm text-error" role="alert">{state.error}</p>}
      <SubmitButton variant="primary" className="w-full">{isEdit ? '저장' : '등록'}</SubmitButton>
    </form>
  )
}
