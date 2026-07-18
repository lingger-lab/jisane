import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getCachedCategories } from '@jisane/shared/categories'
import { InviteButton } from '@/components/invite-button'
import { SuccessToast } from '@jisane/ui/toast'
import { Suspense } from 'react'

interface PageProps {
  params: Promise<{ id: string }>
}

const GRADE_LABEL: Record<string, string> = {
  veteran: '베테랑',
  standard: '전문가',
  new: '신규',
}

export async function generateMetadata(props: PageProps) {
  const { id } = await props.params
  const { data: expert } = await adminClient
    .from('expert')
    .select('name, field')
    .eq('id', id)
    .single()

  if (!expert) return { title: '전문가 - 지사네 기업공간' }

  return {
    title: `${expert.name ?? '전문가'} - ${expert.field ?? '전문가'} | 지사네 기업공간`,
    description: `${expert.name ?? '전문가'}님의 전문 분야와 경력을 확인하세요.`,
  }
}

export default async function ExpertDetailPage(props: PageProps) {
  const { id } = await props.params

  // 로그인 상태 확인
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  // 전문가 정보 + 카테고리 매핑 병렬 조회
  const [{ data: expert }, { data: expertCats }] = await Promise.all([
    adminClient
      .from('expert')
      .select('id, name, field, career_years, grade, status, total_score, career_score, review_score, completion_score, activity_points')
      .eq('id', id)
      .single(),
    adminClient
      .from('expert_category')
      .select('category_id')
      .eq('expert_id', id),
  ])

  if (!expert || expert.status !== 'active') notFound()

  // 이미 초빙했는지 확인 (로그인 상태일 때만)
  let alreadyInvited = false
  if (user) {
    const { data: owner } = await adminClient
      .from('owner')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    if (owner) {
      const { count } = await adminClient
        .from('invitation')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', owner.id)
        .eq('expert_id', id)
        .eq('status', 'invited')
      alreadyInvited = (count ?? 0) > 0
    }
  }

  // 카테고리 라벨 조회
  const catIds = (expertCats ?? []).map((pc) => pc.category_id)
  let categoryLabels: { id: string; label: string; parentLabel: string }[] = []

  if (catIds.length > 0) {
    const allCategories = await getCachedCategories(adminClient)
    const catMap = new Map(allCategories.map((c) => [c.id, c]))

    categoryLabels = catIds
      .map((catId) => {
        const cat = catMap.get(catId)
        if (!cat) return null
        const parent = cat.parent_id ? catMap.get(cat.parent_id) : null
        return {
          id: cat.id,
          label: cat.label,
          parentLabel: parent?.label ?? '',
        }
      })
      .filter(Boolean) as { id: string; label: string; parentLabel: string }[]
  }

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="responsive-container px-4 md:px-6 py-6 md:py-8">
        {/* 네비게이션 */}
        <div className="mb-4 flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-text transition-colors">&larr; 홈</Link>
          <span>/</span>
          <Link href="/experts" className="hover:text-text transition-colors">전문가</Link>
        </div>

        {/* 전문가 프로필 */}
        <section className="rounded-2xl border border-border-light bg-white p-5 md:p-6 lg:p-8 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-text">{expert.name ?? '전문가'}</h1>
              {expert.field && (
                <p className="mt-1 text-sm text-text-muted">{expert.field}</p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                expert.grade === 'veteran'
                  ? 'bg-primary/10 text-primary'
                  : expert.grade === 'new'
                    ? 'bg-surface text-text-subtle'
                    : 'bg-primary/5 text-primary/80'
              }`}
            >
              {GRADE_LABEL[expert.grade] ?? expert.grade}
            </span>
          </div>

          {/* 종합점수 + 경력 */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-accent/5 border border-accent/20 p-3 text-center">
              <span className="text-2xl font-bold text-accent">{expert.total_score?.toFixed(1) ?? '—'}</span>
              <p className="mt-0.5 text-xs text-text-muted">종합점수</p>
            </div>
            {expert.career_years != null && expert.career_years > 0 && (
              <div className="rounded-xl bg-surface-warm p-3 text-center">
                <span className="text-2xl font-bold text-primary">{expert.career_years}년</span>
                <p className="mt-0.5 text-xs text-text-muted">경력</p>
              </div>
            )}
          </div>

          {/* 세부 점수 */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-surface p-2">
              <p className="text-text-subtle">경력</p>
              <p className="font-bold text-text">{expert.career_score?.toFixed(1) ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-surface p-2">
              <p className="text-text-subtle">리뷰</p>
              <p className="font-bold text-text">{expert.review_score?.toFixed(1) ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-surface p-2">
              <p className="text-text-subtle">완료율</p>
              <p className="font-bold text-text">{expert.completion_score?.toFixed(1) ?? '—'}</p>
            </div>
          </div>
          {expert.activity_points > 0 && (
            <p className="mt-2 text-center text-xs text-warning">활동 +{expert.activity_points}</p>
          )}
        </section>

        {/* 전문 분야 */}
        {categoryLabels.length > 0 && (
          <section className="mt-4">
            <h2 className="text-sm font-bold text-text">전문 분야</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryLabels.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/experts?category=${cat.id}`}
                  className="rounded-lg border border-border-light bg-white px-3 py-1.5 text-xs text-text-muted hover:border-primary/30 hover:text-primary transition-colors"
                >
                  <span className="text-text-subtle">{cat.parentLabel}</span>
                  {cat.parentLabel && ' · '}
                  <span className="font-medium">{cat.label}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA — 초빙 */}
        <section className="mt-6 flex flex-col gap-3">
          <Suspense><SuccessToast /></Suspense>
          <InviteButton
            expertId={expert.id}
            isLoggedIn={!!user}
            alreadyInvited={alreadyInvited}
          />
          <Link
            href="/request"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-primary text-sm font-semibold text-primary transition-all hover:bg-primary/5 btn-press"
          >
            의뢰서 작성으로 매칭 받기
          </Link>
          <p className="mt-1 text-center text-xs text-text-subtle">
            초빙하기: 이 전문가에게 직접 요청 · 의뢰서: AI가 최적의 전문가를 매칭
          </p>
        </section>
      </div>
    </div>
  )
}
