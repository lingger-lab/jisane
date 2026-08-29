import { redirect } from 'next/navigation'
import Link from 'next/link'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { ENTERLABS_ID, JISANE_OFFICIAL_ID } from '@jisane/shared/service-catalog'
import { PACKAGE_STATUS_LABELS } from '@jisane/shared/labels'
import { ServiceBanner } from '@jisane/ui/service-banner'
import { NewProviderForm } from './new-provider-form'

export const metadata = { title: '지식서비스 스튜디오 | 지사네 관리자' }

interface StudioRow {
  id: string
  name: string
  status: string
  banner_url: string | null
  provider_id: string
  provider: { name: string } | null
}

export default async function KnowledgeStudioPage() {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  // 엔터랩스(5대 기업전문서비스)는 별도 면 → 제외. 나머지(지사네 공식 + 회원)를 관장.
  const { data } = await adminClient
    .from('service_package')
    .select('id, name, status, banner_url, provider_id, provider:provider(name)')
    .neq('provider_id', ENTERLABS_ID)
    .order('created_at', { ascending: false })

  const items = (data ?? []) as unknown as StudioRow[]

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 animate-fade-in">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-serif font-bold text-text">지식서비스 스튜디오</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            지사네 자체 서비스 등록 + 회원 대리등록(승인 무관). 엔터랩스 5대 서비스는 [기업 전문서비스]에서 관리합니다.
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
        <ul className="flex flex-col gap-2.5">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/dashboard/knowledge-studio/${it.id}`}
                className="flex items-center gap-3 rounded-xl border border-border-light bg-card p-3 shadow-xs transition-colors hover:border-primary/30"
              >
                <div className="w-24 shrink-0">
                  <ServiceBanner src={it.banner_url} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">{it.name}</p>
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {it.provider_id === JISANE_OFFICIAL_ID ? '지사네 공식' : (it.provider?.name ?? '제공자')}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-xs text-text-subtle">
                  {PACKAGE_STATUS_LABELS[it.status] ?? it.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
