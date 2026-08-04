'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ServicePackage, ProviderInfo } from '@jisane/shared/service-catalog'
import { PageHero } from '@jisane/ui/page-hero'

const PRICE_FILTERS = [
  { key: 'all' as const, label: '전체' },
  { key: 'free' as const, label: '무료' },
  { key: 'paid' as const, label: '유료' },
]

export function EducationView({
  packages,
  providers,
}: {
  packages: ServicePackage[]
  providers: ProviderInfo[]
}) {
  const [expandedProvider, setExpandedProvider] = useState<string | null>(providers[0]?.id ?? null)
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all')

  const filtered = expandedProvider
    ? packages.filter(
        (p) =>
          p.providerId === expandedProvider &&
          (priceFilter === 'all' || (priceFilter === 'free' ? p.isFree : !p.isFree))
      )
    : []

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero
        eyebrow="시니어지식인회원"
        title="전문 교육"
        subtitle="역량을 강화하는 교육 과정을 수강하세요."
      />
      <div className="responsive-container px-4 md:px-6 py-6">
      {/* 제공기관 카드 */}
      <div className="mb-5 flex flex-col gap-2">
        {providers.map((prov) => (
          <button
            key={prov.id}
            type="button"
            onClick={() => setExpandedProvider(expandedProvider === prov.id ? null : prov.id)}
            className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${
              expandedProvider === prov.id
                ? 'border-accent bg-accent/5'
                : 'border-border-light hover:border-accent/30'
            }`}
          >
            <div>
              <p className="text-sm font-bold text-text">{prov.name}</p>
              <p className="mt-0.5 text-xs text-text-muted">
                교육 {prov.packageCount}개
                {prov.freeCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-success-light px-1.5 py-0.5 text-xs font-medium text-success">
                    무료 {prov.freeCount}
                  </span>
                )}
              </p>
            </div>
            <span className="text-xs text-text-subtle">{expandedProvider === prov.id ? '▼' : '▶'}</span>
          </button>
        ))}
      </div>

      {/* 무료/유료 필터 */}
      {expandedProvider && (
        <div className="mb-5 flex gap-1.5">
          {PRICE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setPriceFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                priceFilter === f.key
                  ? 'bg-accent/10 text-accent'
                  : 'bg-surface text-text-muted hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* 교육 과정 목록 */}
      {expandedProvider && (
        <div className="flex flex-col gap-4">
          {filtered.map((pkg) => (
            <div
              key={pkg.slug}
              className="rounded-xl border border-border-light p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-text">{pkg.name}</h3>
                    {pkg.isFree ? (
                      <span className="rounded-full bg-success-light px-2 py-0.5 text-xs font-bold text-success">
                        무료
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-text-muted leading-relaxed">
                    {pkg.description}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-accent">
                  {pkg.isFree ? '₩0' : `${pkg.price.toLocaleString('ko-KR')}원`}
                </p>
              </div>

              {/* 제공 내용 */}
              <ul className="mt-3 flex flex-col gap-1">
                {pkg.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-1.5 text-xs text-text-muted">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent/40" />
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
                      href={`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'}${pkg.axDashboardUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-accent/30 hover:text-accent"
                    >
                      자세히
                    </a>
                  )}
                  <Link
                    href={`/education/${pkg.slug}`}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent/90"
                  >
                    수강 신청
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
