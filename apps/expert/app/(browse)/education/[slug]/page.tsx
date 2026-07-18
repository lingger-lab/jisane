'use client'

import { useActionState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getPackageBySlug } from '@jisane/shared/service-catalog'
import { SubmitButton } from '@jisane/ui/submit-button'
import { createEducationOrder } from '@/lib/education/actions'

export default function EducationDetailPage() {
  const params = useParams<{ slug: string }>()
  const pkg = getPackageBySlug(params.slug)
  const [state, formAction] = useActionState(createEducationOrder, {})

  if (!pkg || pkg.targetAudience !== 'expert') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-text-muted">존재하지 않는 교육 과정입니다.</p>
        <Link href="/education" className="mt-4 text-sm text-accent hover:underline">
          교육 목록으로
        </Link>
      </div>
    )
  }

  const axDashboardBase = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <Link href="/education" className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        교육 목록
      </Link>

      {/* 과정 정보 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">{pkg.name}</h1>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">{pkg.description}</p>

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

        <SubmitButton className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md disabled:opacity-50">
          {pkg.price === 0 ? '무료 수강 신청' : `${pkg.price.toLocaleString('ko-KR')}원 수강 신청`}
        </SubmitButton>

        <p className="text-center text-xs text-text-subtle">
          신청 후 담당 매니저가 연락드립니다.
        </p>
      </form>
    </div>
  )
}
