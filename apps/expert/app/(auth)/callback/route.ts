import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/?error=exchange_failed`)
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.redirect(`${origin}/?error=no_user`)
  }

  const provider = (user.app_metadata.provider as string) || 'google'

  // expert 레코드 확인/생성
  const { data: existingExpert } = await adminClient
    .from('expert')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!existingExpert) {
    const { error: insertErr } = await adminClient.from('expert').insert({
      auth_user_id: user.id,
      provider,
      email: user.email!,
    })
    if (insertErr) {
      console.error('[auth/callback] expert insert failed:', insertErr.message)
      return NextResponse.redirect(`${origin}/?error=profile_create`)
    }
    return NextResponse.redirect(`${origin}/register`)
  }

  return NextResponse.redirect(`${origin}/matching`)
}
