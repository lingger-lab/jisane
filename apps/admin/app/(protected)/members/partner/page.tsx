import { redirect } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { PLATFORM_PROVIDER_IDS } from '@jisane/shared/service-catalog'
import { PartnerTab, type ProviderItem, type DraftPackageItem } from '../../dashboard/partner-tab'

export const metadata = { title: '전문가회원 | 지사네 관리자' }

export default async function PartnerMembersPage() {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const [{ data: allProviders }, { data: draftPackages }] = await Promise.all([
    adminClient
      .from('provider')
      .select('id, name, kind, type, status, email, contact, description, website, auth_user_id, created_at')
      .order('created_at', { ascending: false }),
    adminClient
      .from('service_package')
      .select('id, name, category, price, is_free, target_audience, status, created_at, provider:provider!inner(name)')
      .eq('status', 'draft')
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 animate-fade-in">
      <h1 className="mb-4 text-lg font-serif font-bold text-text">전문가회원</h1>
      <PartnerTab
        providers={((allProviders ?? []) as ProviderItem[]).filter((p) => !PLATFORM_PROVIDER_IDS.includes(p.id))}
        draftPackages={(draftPackages ?? []) as unknown as DraftPackageItem[]}
      />
    </div>
  )
}
