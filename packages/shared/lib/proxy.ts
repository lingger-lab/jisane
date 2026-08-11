import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Supabase 세션 갱신 proxy 팩토리 — 단일 소스 (감사 docs/11 P3-74).
 * 앱별 proxy.ts는 이 팩토리를 호출하는 얇은 래퍼만 남긴다.
 *
 * 주의: Next의 `config.matcher`는 빌드 시 정적 분석되어야 하므로(동적 값은 무시됨)
 * matcher 리터럴은 각 앱의 proxy.ts에 남는다.
 */
export function createProxy() {
  return async function proxy(request: NextRequest) {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            // P2-18/52: 갱신 토큰을 request.cookies에도 반영한 뒤 응답을 재생성해야
            // 같은 요청에서 렌더되는 서버 컴포넌트/액션이 새 토큰을 읽는다
            // (공식 @supabase/ssr 미들웨어 패턴: mutate request → NextResponse.next({ request })).
            // 응답을 재생성하지 않으면 최초 응답이 이미 스냅샷한 옛 요청 헤더가 전달되어,
            // 토큰 갱신 요청에서 만료 JWT로 getUser()가 실패하는 간헐 로그아웃이 난다.
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                domain: process.env.COOKIE_DOMAIN ||
                  (process.env.NODE_ENV === 'production' ? '.jisane.cloud' : undefined),
              })
            })
          },
        },
      }
    )

    await supabase.auth.getUser()

    return response
  }
}
