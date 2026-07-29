'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'

function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) return siteUrl
  if (process.env.NODE_ENV === 'production') {
    // localhost로 조용히 리다이렉트되는 사고 방지 — prod에서는 필수
    throw new Error('NEXT_PUBLIC_SITE_URL is not configured')
  }
  return 'http://localhost:3000'
}

async function signInWithOAuth(
  provider: 'google' | 'kakao',
  redirectPath: string = '/callback'
) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const siteUrl = getSiteUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}${redirectPath}`,
    },
  })

  if (error || !data.url) {
    redirect('/?error=auth')
  }

  redirect(data.url)
}

export async function signInWithGoogle() {
  return signInWithOAuth('google')
}

export async function signInWithKakao() {
  return signInWithOAuth('kakao')
}

/** 파트너공간 로그인 — /partner/callback으로 복귀 (Supabase Redirect URLs 등록 필요) */
export async function signInWithGooglePartner() {
  return signInWithOAuth('google', '/partner/callback')
}

export async function signInWithKakaoPartner() {
  return signInWithOAuth('kakao', '/partner/callback')
}

export async function signOut() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()
  redirect('/')
}
