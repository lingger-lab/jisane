import { redirect } from 'next/navigation'
import Link from 'next/link'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { ENTERLABS_ID } from '@jisane/shared/service-catalog'
import { StudioPackageForm, type StudioProviderOption } from '../studio-package-form'

export const metadata = { title: '지식서비스 등록 | 지사네 관리자' }

export default async function NewStudioServicePage() {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const { data } = await adminClient
    .from('provider')
    .select('id, name, kind, status')
    .neq('id', ENTERLABS_ID)
    .neq('status', 'withdrawn')
    .order('name', { ascending: true })

  const providers = (data ?? []) as StudioProviderOption[]

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 animate-fade-in">
      <Link href="/dashboard/knowledge-studio" className="mb-4 inline-block text-sm text-text-muted hover:text-text">
        &larr; 지식서비스 스튜디오
      </Link>
      <h1 className="mb-5 text-lg font-serif font-bold text-text">지식서비스 등록</h1>
      <StudioPackageForm providers={providers} />
    </div>
  )
}
