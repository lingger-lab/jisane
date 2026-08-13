'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHero } from '@jisane/ui/page-hero'
import { FilterRadioGroup } from '@jisane/ui/filter-radio-group'
import type { ServicePackage, ProviderInfo } from '@jisane/shared/service-catalog'
import { ADMIN_URL } from '@/lib/urls'

const CATEGORY_TABS = [
  { key: 'ax_consulting' as const, label: 'AX 컨설팅' },
  { key: 'biz_consulting' as const, label: '경영 컨설팅' },
]

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
    <div className={`rounded-xl border border-border-light p-4 shadow-xs ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-text">{pkg.name}</h3>
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">
              {CATEGORY_LABELS[pkg.category] || pkg.category}
            </span>
            {pkg.featured && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">추천</span>
            )}
            {pkg.isFree && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">무료</span>
            )}
          </div>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">{pkg.description}</p>
        </div>
        <p className="shrink-0 text-sm font-bold text-primary">
          {pkg.isFree ? '무료' : `${pkg.price.toLocaleString('ko-KR')}원`}
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
  providers,
}: {
  packages: ServicePackage[]
  providers: ProviderInfo[]
}) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_TABS)[number]['key']>('ax_consulting')
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all')
  const [expandedProvider, setExpandedProvider] = useState<string | null>(providers[0]?.id ?? null)

  const q = search.trim().toLowerCase()
  const priceMatch = (p: ServicePackage) =>
    priceFilter === 'all' || (priceFilter === 'free' ? p.isFree : !p.isFree)

  // 검색 모드: 전 제공기관·분류를 가로질러 텍스트 매칭 (무료/유료 필터는 유지)
  const searchResults = q
    ? packages.filter(
        (p) =>
          priceMatch(p) &&
          (p.name.toLowerCase().includes(q) ||
            p.provider.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            (CATEGORY_LABELS[p.category] || '').toLowerCase().includes(q) ||
            p.deliverables.some((d) => d.toLowerCase().includes(q)))
      )
    : []

  const filtered = packages.filter(
    (p) =>
      p.category === activeCategory &&
      (expandedProvider === null || p.providerId === expandedProvider) &&
      priceMatch(p)
  )

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero eyebrow="기업회원" title="전문서비스" subtitle="기업 맞춤 전문 서비스를 신청하세요." />

      <div className="container-app px-4 md:px-6 py-6">
      {/* 검색 */}
      <div className="relative mb-5">
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
          className="w-full rounded-xl border border-border-light bg-background py-3 pl-10 pr-4 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
        />
      </div>

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

      {q ? (
        /* ── 검색 결과 (전 제공기관·분류) ── */
        <div>
          <p className="mb-3 text-sm text-text-muted">&ldquo;{search.trim()}&rdquo; 검색 결과 {searchResults.length}건</p>
          {searchResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-light py-8 text-center">
              <p className="text-sm text-text-muted">검색 결과가 없습니다.</p>
              <button type="button" onClick={() => setSearch('')} className="mt-2 text-xs text-primary hover:underline">
                전체 서비스 보기
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {searchResults.map((pkg, i) => <PackageCard key={pkg.slug} pkg={pkg} className={`animate-fade-in stagger-${Math.min(i + 1, 5)}`} />)}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* AX 소개 배너 */}
          <a
            href={`${ADMIN_URL}/ax`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-5 block rounded-xl border border-primary/20 bg-surface-warm p-4 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <p className="text-xs font-semibold text-primary tracking-wide mb-0.5">AI Transformation</p>
            <p className="text-sm font-medium text-text">AX(AI Transformation) 전환이란?</p>
            <p className="mt-1 text-xs text-text-muted">
              AI로 비용 절감·수익 향상·새 수익 모델을 만드는 전환 과정을 알아보세요.
            </p>
          </a>

          {/* 제공기관 카드 — 아코디언(aria-expanded), 펼친 기관의 패키지 패널을 제어 */}
          <div className="mb-5 flex flex-col gap-2">
            {providers.map((prov) => (
              <button
                key={prov.id}
                type="button"
                aria-expanded={expandedProvider === prov.id}
                aria-controls={expandedProvider === prov.id ? 'provider-packages-panel' : undefined}
                onClick={() => setExpandedProvider(expandedProvider === prov.id ? null : prov.id)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                  expandedProvider === prov.id ? 'border-primary bg-primary/5' : 'border-border-light hover:border-primary/30'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-text">{prov.name}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    서비스 {prov.packageCount}개
                    {prov.freeCount > 0 && (
                      <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                        무료 {prov.freeCount}
                      </span>
                    )}
                  </p>
                </div>
                <span aria-hidden="true" className="text-xs text-text-subtle">{expandedProvider === prov.id ? '▼' : '▶'}</span>
              </button>
            ))}
          </div>

          {/* 카테고리 탭 + 패키지 목록 */}
          {expandedProvider && (
            <div id="provider-packages-panel">
              <FilterRadioGroup
                options={CATEGORY_TABS.map((tab) => ({ value: tab.key, label: tab.label }))}
                value={activeCategory}
                onChange={setActiveCategory}
                label="서비스 분류 필터"
                selectOnArrow
                className="mb-5 flex gap-1 rounded-lg bg-surface p-1"
                optionClassName={(selected) =>
                  `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    selected ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
                  }`
                }
              />

              <div className="flex flex-col gap-4">
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-muted">해당 조건의 서비스가 없습니다.</p>
                ) : (
                  filtered.map((pkg, i) => <PackageCard key={pkg.slug} pkg={pkg} className={`animate-fade-in stagger-${Math.min(i + 1, 5)}`} />)
                )}
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}
