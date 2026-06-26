'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getPackagesByAudience, type ServicePackage } from '@jisane/shared/service-catalog'

const CATEGORY_TABS = [
  { key: 'ax_consulting' as const, label: 'AX 컨설팅' },
  { key: 'biz_consulting' as const, label: '경영 컨설팅' },
]

const packages = getPackagesByAudience('owner')

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState<ServicePackage['category']>('ax_consulting')

  const filtered = packages.filter((p) => p.category === activeCategory)

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <h1 className="mb-2 text-2xl font-bold text-primary">전문서비스</h1>
      <p className="mb-5 text-sm text-text-muted">
        기업 맞춤 전문 서비스를 신청하세요.
      </p>

      {/* 카테고리 탭 */}
      <div className="mb-5 flex gap-1 rounded-lg bg-surface p-1">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveCategory(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeCategory === tab.key
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 패키지 목록 */}
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
                  {pkg.featured && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      추천
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-text-muted leading-relaxed">
                  {pkg.description}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-primary">
                {pkg.price === 0 ? '무료' : `${pkg.price.toLocaleString('ko-KR')}원`}
              </p>
            </div>

            {/* 제공 내용 */}
            <ul className="mt-3 flex flex-col gap-1">
              {pkg.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-1.5 text-xs text-text-muted">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                  {d}
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between">
              {pkg.duration && (
                <span className="text-xs text-text-subtle">소요: {pkg.duration}</span>
              )}
              <div className="flex gap-2 ml-auto">
                {pkg.axDashboardUrl && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_AX_DASHBOARD_URL || 'https://axdashboard.vercel.app'}${pkg.axDashboardUrl}`}
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
                  신청하기
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
