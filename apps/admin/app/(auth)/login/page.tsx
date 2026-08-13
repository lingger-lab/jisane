import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { signInWithGoogle, signInWithKakao, signOut } from '@jisane/shared/auth/actions'
import { OAuthButtons } from '@jisane/ui/oauth-buttons'
import { OwlIcon } from '@jisane/ui/icons/owl'

// 콜백/게이트가 넘겨주는 error 코드 → 안내 문구(화이트리스트). 맵에 없으면 일반 문구.
const ERROR_MESSAGES: Record<string, string> = {
  forbidden: '이 계정은 관리자 권한이 없습니다.',
  no_user: '사용자 정보를 가져오지 못했습니다. 다시 시도해주세요.',
  exchange_failed: '로그인 처리에 실패했습니다. 다시 시도해주세요.',
  no_code: '로그인이 완료되지 않았습니다. 다시 시도해주세요.',
}

/**
 * 관리자 전용 로그인 화면.
 * - 이미 관리자면 /dashboard로 보낸다(로그인 화면을 보일 필요 없음).
 * - 로그인했지만 관리자 아님 → 권한 없음 안내 + 로그아웃(다른 계정으로 재로그인).
 * - 미로그인 → 카카오/구글 OAuth(공용 액션). 콜백 jisane.cloud/callback이 ADMIN_EMAILS를
 *   확인해 관리자면 /dashboard로, 아니면 /로 보낸다.
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())
  const isAdmin = !!user?.email && adminEmails.includes(user.email.toLowerCase())

  if (isAdmin) redirect('/dashboard')

  const loggedInNonAdmin = !!user && !isAdmin
  const message = loggedInNonAdmin
    ? `이 계정(${user!.email})은 관리자 권한이 없습니다.`
    : error
      ? (ERROR_MESSAGES[error] ?? '로그인 중 문제가 발생했습니다.')
      : null

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-border-light bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <OwlIcon className="h-10 w-10 text-primary" />
          <h1 className="text-xl font-bold font-serif text-text">관리자 로그인</h1>
          <p className="text-sm text-text-muted">지사네 운영 관리자 전용 화면입니다.</p>
        </div>

        {message && (
          <p role="alert" className="mt-5 rounded-lg bg-error-light px-4 py-3 text-sm text-error">
            {message}
          </p>
        )}

        {loggedInNonAdmin ? (
          <div className="mt-6 flex flex-col gap-3">
            <form action={signOut}>
              <button
                type="submit"
                className="btn-press focus-ring w-full rounded-xl border border-border bg-surface-warm px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-surface"
              >
                로그아웃 후 다른 계정으로 로그인
              </button>
            </form>
            <Link href="/" className="text-center text-sm text-text-muted transition-colors hover:text-text">
              허브로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            <OAuthButtons className="mt-6" signInWithKakao={signInWithKakao} signInWithGoogle={signInWithGoogle} />
            <p className="mt-4 text-center text-xs text-text-subtle">
              등록된 관리자 이메일만 접근할 수 있습니다.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
