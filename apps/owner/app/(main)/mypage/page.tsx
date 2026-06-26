import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signOut } from '@jisane/shared/auth/actions'

export default async function OwnerMyPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: client } = await adminClient
    .from('client')
    .select('email, created_at')
    .eq('auth_user_id', user.id)
    .single()

  if (!client) redirect('/')

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <h1 className="mb-2 text-2xl font-bold text-primary">마이페이지</h1>
      <p className="mb-6 text-sm text-text-muted">
        계정 정보를 확인할 수 있습니다.
      </p>

      {/* 프로필 카드 */}
      <div className="mb-8 rounded-xl border border-border-light bg-surface-warm p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {client.email[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-text">{client.email}</p>
            <p className="text-xs text-text-muted">
              가입: {new Date(client.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
      </div>

      {/* 로그아웃 */}
      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-xl border border-border-light px-6 py-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
        >
          로그아웃
        </button>
      </form>
    </div>
  )
}
