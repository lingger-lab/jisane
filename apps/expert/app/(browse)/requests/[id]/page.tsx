import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { InterestButton } from './interest-button'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: PageProps) {
  const { id } = await props.params
  const { data: request } = await adminClient
    .from('request')
    .select('title')
    .eq('id', id)
    .single()
  return {
    title: request ? `${request.title} - 지사네` : '의뢰 상세 - 지사네',
  }
}

export default async function RequestDetailPage(props: PageProps) {
  const { id } = await props.params

  // 선택적 인증 (공개 페이지)
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  let expertId: string | null = null
  let isInterested = false
  if (user) {
    const { data: expert } = await adminClient
      .from('expert')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    expertId = expert?.id ?? null
    if (expertId) {
      const { data: interest } = await adminClient
        .from('expert_interest')
        .select('id')
        .eq('request_id', id)
        .eq('expert_id', expertId)
        .maybeSingle()
      isInterested = !!interest
    }
  }

  // 의뢰 조회 (open 상태만)
  const { data: request } = await adminClient
    .from('request')
    .select('id, title, detail, req_type, scope, budget_hope, category_id, created_at, owner:owner!inner(company, region, industry)')
    .eq('id', id)
    .eq('status', 'open')
    .single()

  if (!request) notFound()

  // 카테고리 브레드크럼
  let breadcrumb: string | null = null
  if (request.category_id) {
    const { data: categories } = await adminClient
      .from('category')
      .select('id, parent_id, depth, label')

    if (categories) {
      const catMap = new Map(categories.map((c) => [c.id, c]))
      const cat = catMap.get(request.category_id)
      if (cat) {
        const parts: string[] = []
        let current = cat
        while (current) {
          parts.unshift(current.label)
          current = current.parent_id ? catMap.get(current.parent_id)! : undefined!
        }
        breadcrumb = parts.join(' > ')
      }
    }
  }

  const client = request.owner as unknown as { company: string | null; region: string | null; industry: string | null }

  return (
    <div className="flex flex-1 flex-col items-center animate-slide-up">
      <div className="responsive-container px-4 md:px-6 py-6 md:py-8">
        {/* 뒤로 가기 */}
        <Link
          href={request.category_id ? `/requests?category=${request.category_id}` : '/requests'}
          className="text-sm text-text-muted hover:text-text transition-colors"
        >
          &larr; 의뢰 탐색
        </Link>

        {/* 카테고리 브레드크럼 */}
        {breadcrumb && (
          <p className="mt-3 text-xs text-text-subtle">{breadcrumb}</p>
        )}

        {/* 제목 */}
        <h1 className="mt-2 text-xl md:text-2xl font-bold text-text">{request.title}</h1>

        {/* 메타 정보 */}
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
          {request.req_type && (
            <span className="rounded bg-accent/10 px-2 py-0.5 font-medium text-accent">
              {request.req_type}
            </span>
          )}
          <span>{new Date(request.created_at).toLocaleDateString('ko-KR')}</span>
        </div>

        {/* 의뢰 상세 내용 */}
        <div className="mt-4 rounded-xl border border-border-light p-4 md:p-5 lg:p-6 shadow-xs">
          <h2 className="mb-2 text-sm font-semibold text-text">의뢰 내용</h2>
          <p className="whitespace-pre-wrap text-sm text-text-muted leading-relaxed">
            {request.detail}
          </p>
          {request.scope && (
            <div className="mt-3 border-t border-border-light pt-3">
              <p className="text-xs text-text-subtle">범위</p>
              <p className="mt-0.5 text-sm text-text-muted">{request.scope}</p>
            </div>
          )}
        </div>

        {/* 예산 카드 */}
        {request.budget_hope && (
          <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
            <p className="text-sm text-text-muted">작업비</p>
            <p className="text-3xl font-bold text-accent">
              {request.budget_hope.toLocaleString('ko-KR')}
              <span className="text-base font-normal">원</span>
            </p>
            <p className="mt-1 text-xs text-text-muted">VAT 별도 · 수수료 0%</p>
          </div>
        )}

        {/* 기업 정보 */}
        {(client.company || client.region || client.industry) && (
          <div className="mt-4 rounded-xl border border-border-light p-4 md:p-5 lg:p-6 shadow-xs">
            <h2 className="mb-2 text-sm font-semibold text-text">기업 정보</h2>
            <div className="flex flex-col gap-1 text-sm text-text-muted">
              {client.company && <p>{client.company}</p>}
              {client.region && <p className="text-xs text-text-subtle">{client.region}</p>}
              {client.industry && <p className="text-xs text-text-subtle">{client.industry}</p>}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-6">
          {user && expertId ? (
            <InterestButton requestId={request.id} initialInterested={isInterested} />
          ) : (
            <Link
              href="/"
              className="block w-full rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md"
            >
              {user ? '전문가 등록 후 관심 표현' : '로그인 후 관심 표현'}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
