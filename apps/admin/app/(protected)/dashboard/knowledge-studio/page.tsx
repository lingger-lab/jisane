import { redirect } from 'next/navigation'
import Link from 'next/link'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { ENTERLABS_ID } from '@jisane/shared/service-catalog'
import { NewProviderForm } from './new-provider-form'
import { StudioServicesList, type StudioServiceItem } from './studio-services-list'

export const metadata = { title: '지식서비스 스튜디오 | 지사네 관리자' }

export default async function KnowledgeStudioPage() {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  // 엔터랩스(은퇴 provider)는 제외 — 지사네 공식 + 회원 서비스를 단일 관장.
  const { data } = await adminClient
    .from('service_package')
    .select('id, name, status, banner_url, provider_id, pillar, visible, source_ref, price, is_free, target_audience, provider:provider(name)')
    .neq('provider_id', ENTERLABS_ID)
    .order('created_at', { ascending: false })

  const items: StudioServiceItem[] = (data ?? []).map((r) => {
    const row = r as unknown as { provider: { name: string } | null } & Omit<StudioServiceItem, 'provider_name'>
    return { ...row, provider_name: row.provider?.name ?? null }
  })

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 animate-fade-in">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-serif font-bold text-text">지식서비스 스튜디오</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            지사네 모든 서비스를 여기서 등록·셋팅·배너·노출·5대매칭까지 관리합니다(회원 대리등록 포함).
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/knowledge-studio/banner-setting"
            className="rounded-xl border border-border-light px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
          >
            배너 이미지 셋팅
          </Link>
          <Link
            href="/dashboard/knowledge-studio/new"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
          >
            + 지식서비스 등록
          </Link>
        </div>
      </div>

      <details className="mb-5 rounded-xl border border-border-light bg-surface-warm p-4">
        <summary className="cursor-pointer text-sm font-medium text-text">계정 미연결 회원 · 새 제공자 만들기</summary>
        <p className="mb-3 mt-2 text-xs text-text-muted">
          아직 지사네에 가입하지 않은 회원을 대신해 제공자를 만들고 서비스를 등록할 수 있어요. 당사자가 나중에 같은 이메일로 로그인·전문가 신청하면 자동으로 연결됩니다.
        </p>
        <NewProviderForm />
      </details>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border-light bg-card p-10 text-center">
          <p className="text-sm text-text-muted">등록된 지식서비스가 없습니다.</p>
        </div>
      ) : (
        <StudioServicesList items={items} />
      )}
    </div>
  )
}
