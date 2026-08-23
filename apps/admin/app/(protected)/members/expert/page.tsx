import { redirect } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { ExpertMembersTab, type ExpertMemberItem } from '../../dashboard/expert-members-tab'

export const metadata = { title: '시니어지식인 회원 | 지사네 관리자' }

export default async function ExpertMembersPage() {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const { data } = await adminClient
    .from('expert')
    .select('id, email, real_name, name, field, career_years, status, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 animate-fade-in">
      <h1 className="mb-4 text-lg font-serif font-bold text-text">시니어지식인 회원</h1>
      <ExpertMembersTab members={(data ?? []) as ExpertMemberItem[]} />
    </div>
  )
}
