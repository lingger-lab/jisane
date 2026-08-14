import { redirect } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { OwnerMembersTab, type OwnerMemberItem } from '../../dashboard/owner-members-tab'

export const metadata = { title: '기업회원 | 지사네 관리자' }

export default async function OwnerMembersPage() {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const { data } = await adminClient
    .from('owner')
    .select('id, email, company, ceo_name, region, industry, status, completed_deals, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 animate-fade-in">
      <h1 className="mb-4 text-lg font-serif font-bold text-text">기업회원</h1>
      <OwnerMembersTab members={(data ?? []) as OwnerMemberItem[]} />
    </div>
  )
}
