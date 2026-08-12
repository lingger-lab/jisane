import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getCachedCategories } from '@jisane/shared/categories'
import { EXPERT_GRADE_LABELS } from '@jisane/shared/labels'
import { InviteButton } from '@/components/invite-button'
import { PageHero } from '@jisane/ui/page-hero'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: PageProps) {
  const { id } = await props.params
  // 공개 디렉터리에 노출되는 active 전문가만 메타데이터에 이름/분야 노출(대기·정지 상태
  // 전문가 정보가 URL만으로 새지 않게, 페이지 가시성 게이트와 일치. 감사 docs/11 P3-71).
  const { data: expert } = await adminClient
    .from('expert')
    .select('name, field')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!expert) return { title: '시니어지식인 - 지사네 기업회원' }

  return {
    title: `${expert.name ?? '시니어지식인'} - ${expert.field ?? '시니어지식인'} | 지사네 기업회원`,
    description: `${expert.name ?? '시니어지식인'}님의 전문 분야와 경력을 확인하세요.`,
  }
}

export default async function ExpertDetailPage(props: PageProps) {
  const { id } = await props.params

  // 로그인 상태 확인
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  // 시니어지식인 정보 + 카테고리 매핑 병렬 조회
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

  // 경력 카드는 조건부 렌더 — 없을 때 grid-cols-2면 종합점수 카드 옆이 빈칸 (감사 UX P3-58)
  const hasCareer = expert.career_years != null && expert.career_years > 0

  return (
    <div className="flex flex-1 flex-col">
      <PageHero
        eyebrow="기업회원"
        title={expert.name ?? '시니어지식인'}
        subtitle={expert.field ?? undefined}
        back={
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">&larr; 홈</Link>
            <span>/</span>
            <Link href="/experts" className="hover:text-white transition-colors">시니어지식인</Link>
          </div>
        }
      />
      <div className="responsive-container w-full px-4 md:px-6 py-6 md:py-8">
        {/* 시니어지식인 프로필 */}
        <section className="rounded-2xl border border-border-light bg-white p-5 md:p-6 lg:p-8 shadow-xs">
          <div className="flex items-center justify-end gap-3">
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                expert.grade === 'veteran'
                  ? 'bg-primary/10 text-primary'
                  : expert.grade === 'new'
                    ? 'bg-surface text-text-subtle'
                    : 'bg-primary/5 text-primary/80'
              }`}
            >
              {EXPERT_GRADE_LABELS[expert.grade] ?? expert.grade}
            </span>
          </div>

          {/* 종합점수 + 경력 */}
          <div className={`mt-4 grid gap-3 ${hasCareer ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="rounded-xl bg-accent/5 border border-accent/20 p-3 text-center">
              <span className="text-2xl font-bold text-accent">{expert.total_score?.toFixed(1) ?? '—'}</span>
              <p className="mt-0.5 text-xs text-text-muted">종합점수</p>
            </div>
            {hasCareer && (
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
            초빙하기: 이 시니어지식인에게 직접 요청 · 의뢰서: AI가 최적의 시니어지식인을 매칭
          </p>
        </section>
      </div>
    </div>
  )
}
