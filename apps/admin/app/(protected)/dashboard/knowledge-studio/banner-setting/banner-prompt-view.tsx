'use client'

import { useMemo, useState } from 'react'
import { Copy, Check, Shuffle } from 'lucide-react'
import { GeminiIcon } from '@jisane/ui/icons/gemini'
import { PACKAGE_STATUS_LABELS } from '@jisane/shared/labels'
import {
  generateBannerPrompt,
  getComboLabel,
  TOTAL_COMBINATIONS,
  PALETTE_LABELS,
  type BrandPalette,
} from '@/lib/studio/banner-prompt'

export interface BannerServiceRow {
  id: string
  name: string
  value_desc: string | null
  description: string | null
  deliverables: string[] | null
  category: string
  status: string
}

const PALETTE_KEYS = Object.keys(PALETTE_LABELS) as BrandPalette[]
const GEMINI_URL = 'https://gemini.google.com'

export function BannerPromptView({ services }: { services: BannerServiceRow[] }) {
  const [selectedId, setSelectedId] = useState('')
  const [palette, setPalette] = useState<BrandPalette>('jisane')
  const [seed, setSeed] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [copied, setCopied] = useState(false)

  const selected = useMemo(() => services.find((s) => s.id === selectedId) ?? null, [services, selectedId])

  function inputOf(s: BannerServiceRow) {
    return {
      title: s.name,
      subtitle: s.value_desc || s.description || s.name,
      features: s.deliverables ?? [],
      category: s.category,
    }
  }

  function handleSelect(id: string) {
    setSelectedId(id)
    setCopied(false)
    const s = services.find((x) => x.id === id)
    if (s) {
      const newSeed = Math.floor(Math.random() * TOTAL_COMBINATIONS)
      setSeed(newSeed)
      setPrompt(generateBannerPrompt(inputOf(s), newSeed, palette))
    } else {
      setPrompt('')
    }
  }

  function handlePalette(next: BrandPalette) {
    setPalette(next)
    setCopied(false)
    if (selected) setPrompt(generateBannerPrompt(inputOf(selected), seed, next))
  }

  function handleRegenerate() {
    if (!selected) return
    const next = seed + 1
    setSeed(next)
    setPrompt(generateBannerPrompt(inputOf(selected), next, palette))
    setCopied(false)
  }

  async function handleCopy() {
    if (!prompt) return
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 컨트롤 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="svc-select" className="mb-1 block text-xs font-medium text-text-muted">지식서비스 선택</label>
          <select
            id="svc-select"
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
            className="focus-ring w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text"
          >
            <option value="">서비스를 선택하세요</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.status !== 'published' ? ` · ${PACKAGE_STATUS_LABELS[s.status] ?? s.status}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:w-56">
          <label htmlFor="palette-select" className="mb-1 block text-xs font-medium text-text-muted">배경 팔레트</label>
          <select
            id="palette-select"
            value={palette}
            onChange={(e) => handlePalette(e.target.value as BrandPalette)}
            className="focus-ring w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text"
          >
            {PALETTE_KEYS.map((key) => (
              <option key={key} value={key}>{PALETTE_LABELS[key]}</option>
            ))}
          </select>
        </div>
      </div>

      {selected ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-text">생성된 프롬프트</h2>
              <p className="mt-0.5 text-xs text-text-subtle">{getComboLabel(seed)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRegenerate}
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface"
              >
                <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                다른 스타일로 생성
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className={`focus-ring inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors ${copied ? 'bg-success-solid' : 'bg-primary hover:bg-primary-light'}`}
              >
                {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                {copied ? '복사됨' : '프롬프트 복사'}
              </button>
              {/* Gemini 링크 — 복사한 프롬프트를 붙여 이미지 생성 */}
              <a
                href={GEMINI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-text"
              >
                <GeminiIcon className="h-4 w-4" />
                Gemini 열기
              </a>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={12}
            aria-label="배너 이미지 생성 프롬프트"
            className="focus-ring w-full resize-y rounded-xl border border-border-light bg-surface p-4 font-mono text-sm leading-relaxed text-text"
          />
          <p className="mt-2 text-xs text-text-subtle">
            복사 → <span className="font-medium text-text">Gemini</span>에 붙여넣기 → 16:9 이미지 생성 → 다운로드 후 서비스 편집화면의 배너 업로드로 등록.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-light bg-card px-6 py-16 text-center">
          <p className="text-sm text-text-muted">서비스를 선택하면 배너 이미지 프롬프트가 생성됩니다.</p>
        </div>
      )}
    </div>
  )
}
