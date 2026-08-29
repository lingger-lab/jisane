'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@jisane/ui/badge'
import { PageHero } from '@jisane/ui/page-hero'
import { ServiceBanner } from '@jisane/ui/service-banner'
import { FilterRadioGroup } from '@jisane/ui/filter-radio-group'
import {
  PILLAR_ORDER,
  PILLAR_LABELS,
  formatPackagePrice,
  type ServicePackage,
  type EnterprisePillar,
} from '@jisane/shared/service-catalog'
import { ADMIN_URL } from '@/lib/urls'

const CATEGORY_LABELS: Record<string, string> = {
  ax_consulting: 'AX 컨설팅',
  biz_consulting: '경영 컨설팅',
  education: '교육',
}

const PRICE_FILTERS = [
  { key: 'all' as const, label: '전체' },
  { key: 'free' as const, label: '무료' },
  { key: 'paid' as const, label: '유료' },
]

/** 전문서비스 카드 — 아코디언·검색결과 공용 */
function PackageCard({ pkg, className = '' }: { pkg: ServicePackage; className?: string }) {
  return (
    <div className={`rounded-xl border border-border-light p-4 shadow-xs card-hover ${className}`}>
      {pkg.bannerUrl && (
        <div className="mb-3">
          <ServiceBanner src={pkg.bannerUrl} sizes="(max-width: 768px) 100vw, 640px" />
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-text">{pkg.name}</h3>
            <Badge variant="neutral">{CATEGORY_LABELS[pkg.category] || pkg.category}</Badge>
            {pkg.isOfficial && <Badge variant="primary">지사네 공식</Badge>}
            {pkg.featured && <Badge variant="accent">추천</Badge>}
            {pkg.isFree && <Badge variant="primary">무료</Badge>}
          </div>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">{pkg.description}</p>
        </div>
        <p className="shrink-0 text-sm font-bold text-primary">
          {formatPackagePrice(pkg)}
        </p>
      </div>

      <ul className="mt-3 flex flex-col gap-1">
        {pkg.deliverables.map((d) => (
          <li key={d} className="flex items-start gap-1.5 text-xs text-text-muted">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
            {d}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-text-subtle">
          제공: {pkg.provider}
          {pkg.duration && ` · 소요: ${pkg.duration}`}
        </span>
        <div className="flex gap-2 ml-auto">
          {pkg.axDashboardUrl && (
            <a
              href={`${ADMIN_URL}${pkg.axDashboardUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
            >
              자세히
            </a>
          )}
          <Link
            href={`/services/${pkg.slug}`}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-light"
          >
            {pkg.isFree ? '신청하기' : '상담 신청'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export function ServicesView({
  packages,
  initialPillar,
}: {
  packages: ServicePackage[]
  initialPillar?: string
}) {
  // 실제 서비스가 있는 pillar만 탭으로 노출(self-healing). '전체'(all)는 항상 선두.
  const availablePillars = PILLAR_ORDER.filter((code) => packages.some((p) => p.pillar === code))
  const initialActive: EnterprisePillar | 'all' =
    initialPillar && availablePillars.includes(initialPillar as EnterprisePillar)
      ? (initialPillar as EnterprisePillar)
      : 'all'

  const [search, setSearch] = useState('')
  const [activePillar, setActivePillar] = useState<EnterprisePillar | 'all'>(initialActive)
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all')

  const q = search.trim().toLowerCase()
  const priceMatch = (p: ServicePackage) =>
    priceFilter === 'all' || (priceFilter === 'free' ? p.isFree : !p.isFree)
  const searchMatch = (p: ServicePackage) =>
    q === '' ||
    p.name.toLowerCase().includes(q) ||
    p.provider.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    (CATEGORY_LABELS[p.category] || '').toLowerCase().includes(q) ||
    p.deliverables.some((d) => d.toLowerCase().includes(q))

  // 플랫 배너 그리드 — pillar 카테고리 + 무료/유료 + 검색을 한 번에 적용(제공자 아코디언 제거).
  const filtered = packages.filter((p) => (activePillar === 'all' || p.pillar === activePillar) && priceMatch(p) && searchMatch(p))
  const hasFilter = q !== '' || activePillar !== 'all' || priceFilter !== 'all'

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero eyebrow="기업회원" title="지식서비스" subtitle="기업 운영에 바로 쓰는 전문 서비스를 한곳에서" />

      <div className="container-app px-4 md:px-6 py-6">
      {/* 검색 — 입력 즉시 필터(라이브). 공용 SearchBox와 동일한 돋보기+검색버튼으로 일관.
          라이브라 제출은 새로고침만 막고(필터는 onChange로 이미 적용), 버튼은 검색 affordance. */}
      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mb-5">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.34-4.34m0 0A7 7 0 1 0 6.71 6.71a7 7 0 0 0 9.95 9.95Z" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="서비스명·업체·분류로 검색"
          aria-label="전문서비스 검색"
          className="w-full rounded-xl border border-border-light bg-background py-3 pl-10 pr-20 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-light"
        >
          검색
        </button>
      </form>

      {/* 무료/유료 필터 (검색·아코디언 공통) */}
      <FilterRadioGroup
        options={PRICE_FILTERS.map((f) => ({ value: f.key, label: f.label }))}
        value={priceFilter}
        onChange={setPriceFilter}
        label="가격 필터"
        selectOnArrow
        className="mb-5 flex gap-1.5"
        optionClassName={(selected) =>
          `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            selected ? 'bg-primary/10 text-primary' : 'bg-surface text-text-muted hover:text-text'
          }`
        }
      />

      {/* 5대 지원 카테고리 필터 (전체+5) */}
      <FilterRadioGroup
        options={[{ value: 'all' as const, label: '전체' }, ...availablePillars.map((code) => ({ value: code, label: PILLAR_LABELS[code] }))]}
        value={activePillar}
        onChange={setActivePillar}
        label="서비스 분류 필터"
        selectOnArrow
        className="mb-5 flex flex-wrap gap-1.5"
        optionClassName={(selected) =>
          `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            selected ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:text-text'
          }`
        }
      />

      {/* 전체 배너 그리드 (제공자 아코디언 제거) */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-light py-8 text-center">
          <p className="text-sm text-text-muted">조건에 맞는 서비스가 없습니다.</p>
          {hasFilter && (
            <button
              type="button"
              onClick={() => { setSearch(''); setActivePillar('all'); setPriceFilter('all') }}
              className="mt-2 text-xs text-primary hover:underline"
            >
              전체 서비스 보기
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-text-muted">{filtered.length}개 서비스</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((pkg, i) => <PackageCard key={pkg.slug} pkg={pkg} className={`animate-appear stagger-${Math.min(i + 1, 5)}`} />)}
          </div>
        </>
      )}
      </div>
    </div>
  )
}
