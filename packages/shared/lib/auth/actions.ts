'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server'

/** env URL 정규화 — 값에 섞인 공백·줄바꿈·후행 슬래시 제거 (오염된 env가 콜백 URL을 깨뜨리는 사고 방지) */
function cleanUrl(value: string): string {
  return value.trim().replace(/\s+/g, '').replace(/\/+$/, '')
}

function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) return cleanUrl(siteUrl)
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

  // 절대 URL이면 그대로 사용(가입 페이지에서 타 서브도메인 콜백으로 보낼 때),
  // 상대 경로면 현재 사이트 기준. 쿠키가 .jisane.cloud 공유라 크로스 서브도메인도 동작.
  const redirectTo = redirectPath.startsWith('http')
    ? redirectPath
    : `${getSiteUrl()}${redirectPath}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })

  if (error || !data.url) {
    redirect('/?error=auth')
  }

  redirect(data.url)
}

// ── 회원가입(/join) 역할별 OAuth — 각 역할의 콜백으로 복귀 ──
// join=1 쿼리로 "유형선택을 거친 가입"임을 표시한다. 콜백은 join=1일 때만 역할 행을
// 생성하고, 없으면 /join으로 유도(유형선택 없는 자동 가입 방지).
// ※ Supabase Redirect URLs에 `?join=1` 포함 URL(또는 /callback** 와일드카드) 등록 필요.
function ownerCallback() {
  return `${cleanUrl(process.env.NEXT_PUBLIC_OWNER_URL || 'https://owner.jisane.cloud')}/callback?join=1`
}
function expertCallback() {
  return `${cleanUrl(process.env.NEXT_PUBLIC_EXPERT_URL || 'https://expert.jisane.cloud')}/callback?join=1`
}

export async function joinAsOwnerKakao() {
  return signInWithOAuth('kakao', ownerCallback())
}
export async function joinAsOwnerGoogle() {
  return signInWithOAuth('google', ownerCallback())
}
export async function joinAsExpertKakao() {
  return signInWithOAuth('kakao', expertCallback())
}
export async function joinAsExpertGoogle() {
  return signInWithOAuth('google', expertCallback())
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
