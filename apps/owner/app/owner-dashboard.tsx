import Link from 'next/link'
import { adminClient } from '@jisane/shared/supabase/admin'
import { REQUEST_STATUS_LABELS, DEAL_STATUS_LABELS } from '@jisane/shared/labels'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-info-light text-info',
  matching: 'bg-warning-light text-warning',
  dealt: 'bg-success-light text-success',
  closed: 'bg-surface text-text-subtle',
  quoted: 'bg-info-light text-info',
  working: 'bg-warning-light text-warning',
  done: 'bg-success-light text-success',
}

/**
 * 로그인한 기업회원의 홈 대시보드 — 랜딩(redirect) 대신 홈에 렌더.
 * 인사 + 내 현황 요약 + 주요 액션. 상세는 /status, 정보수정은 /mypage.
 */
export async function OwnerDashboard({
  ownerId,
  email,
  company,
}: {
  ownerId: string
  email: string
  company: string | null
}) {
  const [reqCountRes, dealCountRes, orderCountRes, recentReqRes] = await Promise.all([
    adminClient.from('request').select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId).in('status', ['open', 'matching']),
    adminClient.from('deal').select('id, request:request!inner(owner_id)', { count: 'exact', head: true })
      .eq('request.owner_id', ownerId).in('status', ['quoted', 'working']),
    adminClient.from('service_order').select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId).in('status', ['pending', 'paid', 'processing']),
    adminClient.from('request').select('id, title, status, created_at')
      .eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(3),
  ])

  const progressRequests = reqCountRes.count || 0
  const progressDeals = dealCountRes.count || 0
  const progressOrders = orderCountRes.count || 0
  const recent = (recentReqRes.data || []) as Array<{ id: string; title: string; status: string; created_at: string }>
  const greeting = company || email.split('@')[0]

  return (
    <div className="flex flex-1 flex-col items-center animate-fade-in">
      {/* 인사 히어로 — 로그인 상태 */}
      <div className="hero-dark w-full">
        <section className="responsive-container flex flex-col gap-2 px-4 md:px-6 pt-10 md:pt-14 pb-8 md:pb-10">
          <span className="hero-eyebrow self-start">기업공간</span>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-white leading-snug">
            {greeting}님, 반갑습니다
          </h1>
          <p className="text-sm md:text-base text-white/75">진행 중인 현황을 한눈에 확인하세요.</p>
        </section>
      </div>

      <main className="responsive-container flex w-full flex-col gap-6 px-4 md:px-6 py-8">
        {/* 프로필 미완성 유도 */}
        {!company && (
          <Link
            href="/mypage"
            className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning-light/40 p-4 transition-colors hover:bg-warning-light"
          >
            <div>
              <p className="text-sm font-semibold text-text">회사 정보를 등록해주세요</p>
              <p className="mt-0.5 text-xs text-text-muted">회사명·연락처를 채우면 매칭이 더 정확해집니다.</p>
            </div>
            <span className="text-sm font-semibold text-warning shrink-0">등록 &rarr;</span>
          </Link>
        )}

        {/* 내 현황 요약 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-text">내 현황</h2>
            <Link href="/status" className="text-xs font-medium text-primary hover:underline">전체 보기</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/status" className="rounded-xl border border-border-light bg-white p-4 text-center shadow-xs transition-colors hover:border-primary/30">
              <p className="text-2xl font-bold text-primary">{progressRequests}</p>
              <p className="mt-1 text-xs text-text-muted">진행 의뢰</p>
            </Link>
            <Link href="/status" className="rounded-xl border border-border-light bg-white p-4 text-center shadow-xs transition-colors hover:border-primary/30">
              <p className="text-2xl font-bold text-primary">{progressDeals}</p>
              <p className="mt-1 text-xs text-text-muted">진행 거래</p>
            </Link>
            <Link href="/status" className="rounded-xl border border-border-light bg-white p-4 text-center shadow-xs transition-colors hover:border-primary/30">
              <p className="text-2xl font-bold text-primary">{progressOrders}</p>
              <p className="mt-1 text-xs text-text-muted">진행 서비스</p>
            </Link>
          </div>
        </section>

        {/* 최근 의뢰 */}
        {recent.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-bold text-text">최근 의뢰</h2>
            <ul className="flex flex-col gap-2">
              {recent.map((req) => (
                <li key={req.id}>
                  <Link
                    href={`/status/${req.id}`}
                    className="flex items-center justify-between rounded-lg border border-border-light p-3 shadow-xs card-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{req.title}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{new Date(req.created_at).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status] || 'bg-surface text-text-subtle'}`}>
                      {REQUEST_STATUS_LABELS[req.status] || DEAL_STATUS_LABELS[req.status] || req.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 주요 액션 */}
        <section className="grid grid-cols-2 gap-3">
          <Link href="/request" className="rounded-2xl bg-primary p-5 text-white shadow-sm transition-all hover:bg-primary-light">
            <p className="text-base font-bold">일 맡기기</p>
            <p className="mt-1 text-xs text-white/80">새 의뢰를 등록합니다</p>
          </Link>
          <Link href="/services" className="rounded-2xl border border-border-light bg-white p-5 shadow-sm transition-colors hover:border-primary/30">
            <p className="text-base font-bold text-text">전문서비스</p>
            <p className="mt-1 text-xs text-text-muted">S/W·P/G·컨설팅 둘러보기</p>
          </Link>
        </section>
      </main>
    </div>
  )
}
