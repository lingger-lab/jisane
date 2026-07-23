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

export async function signInWithGoogle() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const siteUrl = getSiteUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/callback`,
    },
  })

  if (error || !data.url) {
    redirect('/?error=auth')
  }

  redirect(data.url)
}

export async function signInWithKakao() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const siteUrl = getSiteUrl()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${siteUrl}/callback`,
    },
  })

  if (error || !data.url) {
    redirect('/?error=auth')
  }

  redirect(data.url)
}

export async function signOut() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()
  redirect('/')
}
