'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { ServicePackage } from '@jisane/shared/service-catalog'
import { SubmitButton } from '@jisane/ui/submit-button'
import { PageHero } from '@jisane/ui/page-hero'
import { createEducationOrder } from '@/lib/education/actions'
import { ADMIN_URL } from '@/lib/urls'

export function EducationDetailView({ pkg }: { pkg: ServicePackage }) {
  const [state, formAction] = useActionState(createEducationOrder, {})

  const axDashboardBase = ADMIN_URL

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero
        eyebrow="시니어지식인회원"
        title={pkg.name}
        subtitle={`제공: ${pkg.provider}`}
        back={<Link href="/education" className="text-sm text-white/70 hover:text-white transition-colors">&larr; 교육 목록</Link>}
      />
      <div className="container-app px-4 md:px-6 py-6">
      {/* 과정 정보 */}
      <div className="mb-6">
        <p className="text-sm text-text-muted leading-relaxed">{pkg.description}</p>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-accent">
            {pkg.price === 0 ? '무료' : `${pkg.price.toLocaleString('ko-KR')}원`}
          </span>
          {pkg.duration && (
            <span className="text-sm text-text-subtle">· 소요 {pkg.duration}</span>
          )}
        </div>
      </div>

      {/* 제공 내용 */}
      <div className="mb-6 rounded-xl border border-border-light bg-surface-warm p-4">
        <h2 className="mb-3 text-sm font-bold text-text">교육 내용</h2>
        <ul className="flex flex-col gap-2">
          {pkg.deliverables.map((d) => (
            <li key={d} className="flex items-start gap-2 text-sm text-text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      {/* axdashboard 링크 */}
      {pkg.axDashboardUrl && (
        <a
          href={`${axDashboardBase}${pkg.axDashboardUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-border-light px-4 py-3 text-sm font-medium text-text-muted transition-colors hover:border-accent/30 hover:text-accent"
        >
          관련 자료 보기
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      )}

      {/* 수강 신청 폼 */}
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="slug" value={pkg.slug} />

        <div>
          <label htmlFor="detail" className="mb-1 block text-sm font-medium text-text">
            요청 사항 <span className="text-xs text-text-subtle">(선택)</span>
          </label>
          <textarea
            id="detail"
            name="detail"
            rows={4}
            placeholder="추가로 전달하고 싶은 내용이 있으면 적어주세요."
            className="w-full resize-none rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none transition-colors"
          />
        </div>

        {state.error && (
          <p className="text-sm text-error">{state.error}</p>
        )}

        <SubmitButton variant="accent" className="rounded-xl px-6 py-3 font-semibold shadow-sm hover:shadow-md">
          {pkg.price === 0 ? '무료 수강 신청' : '상담 신청'}
        </SubmitButton>

        <p className="text-center text-xs text-text-subtle">
          신청 후 담당 매니저가 연락드립니다.
        </p>
      </form>
      </div>
    </div>
  )
}
