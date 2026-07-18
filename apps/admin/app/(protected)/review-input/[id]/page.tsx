import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import type { DealForReview } from '@jisane/shared/query-types'
import { ReviewForm } from './review-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ReviewInputPage(props: PageProps) {
  const { id: dealId } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // deal + request + expert 조회
  const { data: deal } = await adminClient
    .from('deal')
    .select(`
      id, work_fee, match_fee, total_pay, status,
      request:request!inner(id, title, req_type, detail),
      expert:expert!inner(id, name, field, career_years)
    `)
    .eq('id', dealId)
    .returns<DealForReview[]>()
    .single()

  if (!deal) redirect('/dashboard')

  const req = deal.request
  const expert = deal.expert

  // 기존 리뷰 확인 + AI 제안 조회
  const [{ data: existingReview }, { data: aiSuggestion }] = await Promise.all([
    adminClient
      .from('review')
      .select('id, rating, comment, internal_note, process_rating, result_rating, response_rating')
      .eq('deal_id', dealId)
      .eq('author_type', 'admin')
      .single(),
    adminClient
      .from('review_ai_suggestion')
      .select('process_rating, result_rating, response_rating, overall_rating, reasoning, status')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  return (
    <div className="px-6 py-8">
      <Link href="/dashboard" className="mb-4 inline-block text-sm text-text-muted hover:text-text">
        &larr; 대시보드
      </Link>

      <h1 className="mb-6 text-xl font-bold text-text">지사네 리뷰 입력</h1>

      {/* 거래 요약 */}
      <div className="mb-6 rounded-xl border border-border-light p-4 shadow-xs">
        <h2 className="font-medium text-text">{req.title}</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-text-muted">분야</p>
            <p className="text-text">{req.req_type || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">전문가</p>
            <p className="text-text">{expert.name || '미등록'} ({expert.field}, {expert.career_years || 0}년)</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">작업비</p>
            <p className="text-text">{deal.work_fee.toLocaleString('ko-KR')}원</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">총액</p>
            <p className="text-text">{deal.total_pay.toLocaleString('ko-KR')}원</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-text-muted">{req.detail}</p>
      </div>

      {existingReview ? (
        <div className="rounded-xl border border-success/20 bg-success-light p-4">
          <p className="font-medium text-success">리뷰 작성 완료</p>
          <p className="mt-1 text-sm text-success/80">
            별점: {'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}
          </p>
          {existingReview.process_rating && (
            <p className="mt-1 text-xs text-success/70">
              진행과정 {existingReview.process_rating}점 · 결과물 {existingReview.result_rating}점 · 대응도 {existingReview.response_rating}점
            </p>
          )}
          {existingReview.comment && (
            <p className="mt-1 text-sm text-success/80">의견: {existingReview.comment}</p>
          )}
        </div>
      ) : (
        <ReviewForm dealId={dealId} aiSuggestion={aiSuggestion} />
      )}
    </div>
  )
}
