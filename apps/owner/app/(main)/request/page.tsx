'use client'

import { useActionState, useState } from 'react'
import { createRequest } from '@/lib/request/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

/** 대분류 → 중분류 구조 (category 테이블과 동기) */
const CATEGORY_TREE = [
  {
    label: '경영·창업',
    children: ['창업코칭', '사업계획서', '정부자금·보조금', '경영진단'],
  },
  {
    label: 'AI·디지털전환',
    children: ['AI진단', 'AEO최적화', '업무자동화', '데이터분석'],
  },
  {
    label: '문서·행정',
    children: ['제안서·기획서', '보고서', '매뉴얼·가이드', '번역·통역'],
  },
  {
    label: '생산·품질',
    children: ['품질관리', '생산관리', 'ISO·인증', '안전관리'],
  },
  {
    label: '연구개발',
    children: ['R&D 기획', '기술개발', '특허·지식재산', '기술이전·사업화'],
  },
  {
    label: '전문서비스',
    children: ['세무·회계', '법무', '노무', '마케팅'],
  },
  {
    label: '크리에이티브',
    children: ['디자인', '웹개발', '영상제작', '콘텐츠제작'],
  },
] as const

export default function RequestPage() {
  const [state, formAction] = useActionState(createRequest, {})
  const [selectedMajor, setSelectedMajor] = useState(0)
  const [selectedChip, setSelectedChip] = useState<string | null>(null)

  const currentMajor = CATEGORY_TREE[selectedMajor]

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold text-primary">일 맡기기</h1>

      <form
        action={formAction}
        className="flex flex-col gap-5"
      >
        {/* 대분류 탭 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text">
            어떤 일을 맡기시나요?
          </label>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {CATEGORY_TREE.map((major, idx) => (
              <button
                key={major.label}
                type="button"
                onClick={() => {
                  setSelectedMajor(idx)
                  setSelectedChip(null)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedMajor === idx
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-muted hover:bg-surface-hover'
                }`}
              >
                {major.label}
              </button>
            ))}
          </div>

          {/* 중분류 칩 */}
          <div className="flex flex-wrap gap-2">
            {currentMajor.children.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setSelectedChip(selectedChip === chip ? null : chip)}
                aria-pressed={selectedChip === chip}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selectedChip === chip
                    ? 'border-accent bg-accent/10 font-medium text-accent'
                    : 'border-border-light text-text-muted hover:border-accent/30'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
          <input type="hidden" name="req_type" value={selectedChip || ''} />
        </div>

        {/* 제목 */}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-text">
            의뢰 제목 <span className="text-error">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="예: 카페 로고 디자인 의뢰"
            className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
          />
        </div>

        {/* 상세 내용 */}
        <div>
          <label htmlFor="detail" className="mb-1 block text-sm font-medium text-text">
            상세 내용 <span className="text-error">*</span>
          </label>
          <textarea
            id="detail"
            name="detail"
            required
            rows={6}
            placeholder="원하시는 작업 내용을 자유롭게 적어주세요. 지사네 매니저가 확인 후 적합한 시니어 전문가를 연결해드립니다."
            className="w-full resize-none rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
          />
        </div>

        {/* 희망 예산 (선택) */}
        <div>
          <label htmlFor="budget_hope" className="mb-1 block text-sm font-medium text-text">
            희망 예산 <span className="text-xs text-text-subtle">(선택)</span>
          </label>
          <div className="relative">
            <input
              id="budget_hope"
              name="budget_hope"
              type="number"
              min="0"
              step="10000"
              placeholder="예: 500000"
              className="w-full rounded-xl border border-border-light bg-background px-4 py-3 pr-10 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">
              원
            </span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {state.error && (
          <p className="text-sm text-error">{state.error}</p>
        )}

        {/* 제출 */}
        <SubmitButton className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md disabled:opacity-50">
          의뢰 등록하기
        </SubmitButton>
      </form>
    </div>
  )
}
