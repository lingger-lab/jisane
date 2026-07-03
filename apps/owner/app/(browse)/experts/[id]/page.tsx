import Link from 'next/link'
import { notFound } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'

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
  const { data: partner } = await adminClient
    .from('partner')
    .select('name, field')
    .eq('id', id)
    .single()

  if (!partner) return { title: '전문가 - 지사네 기업공간' }

  return {
    title: `${partner.name ?? '전문가'} - ${partner.field ?? '시니어 전문가'} | 지사네 기업공간`,
    description: `${partner.name ?? '전문가'}님의 전문 분야와 경력을 확인하세요.`,
  }
}

export default async function ExpertDetailPage(props: PageProps) {
  const { id } = await props.params

  // 전문가 정보 + 카테고리 매핑 병렬 조회
  const [{ data: partner }, { data: partnerCats }] = await Promise.all([
    adminClient
      .from('partner')
      .select('id, name, field, career_yrs, grade, status')
      .eq('id', id)
      .single(),
    adminClient
      .from('partner_category')
      .select('category_id')
      .eq('partner_id', id),
  ])

  if (!partner || partner.status !== 'active') notFound()

  // 카테고리 라벨 조회
  const catIds = (partnerCats ?? []).map((pc) => pc.category_id)
  let categoryLabels: { id: string; label: string; parentLabel: string }[] = []

  if (catIds.length > 0) {
    const { data: cats } = await adminClient
      .from('category')
      .select('id, label, parent_id, depth')
      .in('id', catIds)

    if (cats && cats.length > 0) {
      const parentIds = [...new Set(cats.map((c) => c.parent_id).filter(Boolean))]
      const { data: parents } = await adminClient
        .from('category')
        .select('id, label')
        .in('id', parentIds as string[])

      const parentMap = new Map((parents ?? []).map((p) => [p.id, p.label]))

      categoryLabels = cats.map((c) => ({
        id: c.id,
        label: c.label,
        parentLabel: parentMap.get(c.parent_id ?? '') ?? '',
      }))
    }
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
              <h1 className="text-xl md:text-2xl font-bold text-text">{partner.name ?? '전문가'}</h1>
              {partner.field && (
                <p className="mt-1 text-sm text-text-muted">{partner.field}</p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                partner.grade === 'veteran'
                  ? 'bg-primary/10 text-primary'
                  : partner.grade === 'new'
                    ? 'bg-surface text-text-subtle'
                    : 'bg-primary/5 text-primary/80'
              }`}
            >
              {GRADE_LABEL[partner.grade] ?? partner.grade}
            </span>
          </div>

          {partner.career_yrs && (
            <div className="mt-4 rounded-xl bg-surface-warm p-3 text-center">
              <span className="text-2xl font-bold text-primary">{partner.career_yrs}년</span>
              <p className="mt-0.5 text-xs text-text-muted">경력</p>
            </div>
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

        {/* CTA */}
        <section className="mt-6">
          <Link
            href="/request"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md btn-press"
          >
            이 분야 전문가에게 의뢰하기
          </Link>
          <p className="mt-2 text-center text-xs text-text-subtle">
            로그인 후 의뢰를 등록하면 AI가 최적의 전문가를 매칭해드립니다
          </p>
        </section>
      </div>
    </div>
  )
}
