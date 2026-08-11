import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// 회귀 가드: proxy 팩토리 추출(감사 docs/11 P3-74) + 세션 갱신 쿠키 동기화(P2-18/52).
// (1) 세션 갱신 동작·쿠키 도메인 폴백이 사본과 동일한지,
// (2) 토큰 갱신 시 request.cookies에도 쓰고 응답을 재생성해 같은 요청의
//     서버 컴포넌트가 새 토큰을 읽는지(공식 @supabase/ssr 패턴),
// (3) 각 앱 proxy.ts가 인라인 구현 없이 팩토리의 얇은 래퍼인지 고정한다.

interface SetCookie {
  name: string
  value: string
  options: Record<string, unknown>
}

interface ResponseInstance {
  init: unknown
  setCookies: SetCookie[]
  cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void }
}

interface ClientOptions {
  cookies: {
    getAll: () => Array<{ name: string; value: string }>
    setAll: (cookies: SetCookie[]) => void
  }
}

const mockState = {
  clientArgs: null as null | { url: string; key: string; options: ClientOptions },
  getUserCalls: 0,
  // getUser 중 supabase가 세션을 갱신하는 상황 시뮬: 설정 시 setAll을 호출
  refreshOnGetUser: null as null | SetCookie[],
  responseInstances: [] as ResponseInstance[],
  requestCookieSets: [] as Array<{ name: string; value: string }>,
}

vi.mock('@supabase/ssr', () => ({
  createServerClient: (url: string, key: string, options: ClientOptions) => {
    mockState.clientArgs = { url, key, options }
    return {
      auth: {
        getUser: async () => {
          mockState.getUserCalls++
          if (mockState.refreshOnGetUser) {
            options.cookies.setAll(mockState.refreshOnGetUser)
          }
          return { data: { user: null }, error: null }
        },
      },
    }
  },
}))

vi.mock('next/server', () => ({
  NextResponse: {
    next: (init: unknown) => {
      const instance: ResponseInstance = {
        init,
        setCookies: [],
        cookies: {
          set: (name, value, options) => {
            instance.setCookies.push({ name, value, options })
          },
        },
      }
      mockState.responseInstances.push(instance)
      return instance
    },
  },
}))

import { createProxy } from './proxy'
import type { NextRequest } from 'next/server'

const fakeRequest = () =>
  ({
    cookies: {
      getAll: () => [{ name: 'sb-auth', value: 'tok' }],
      set: (name: string, value: string) => {
        mockState.requestCookieSets.push({ name, value })
      },
    },
  }) as unknown as NextRequest

beforeEach(() => {
  mockState.clientArgs = null
  mockState.getUserCalls = 0
  mockState.refreshOnGetUser = null
  mockState.responseInstances = []
  mockState.requestCookieSets = []
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://unit.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'pk-test')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('createProxy — 세션 갱신 동작', () => {
  it('NextResponse.next({ request })로 응답을 만들고 env url·key로 클라이언트를 생성하며 getUser를 호출한다', async () => {
    const request = fakeRequest()
    const response = await createProxy()(request)

    expect(mockState.responseInstances[0].init).toEqual({ request })
    expect(mockState.clientArgs?.url).toBe('https://unit.supabase.co')
    expect(mockState.clientArgs?.key).toBe('pk-test')
    expect(mockState.getUserCalls).toBe(1)
    expect(response).toBeDefined()
  })

  it('cookies.getAll은 요청 쿠키를 그대로 반환한다', async () => {
    await createProxy()(fakeRequest())

    expect(mockState.clientArgs!.options.cookies.getAll()).toEqual([
      { name: 'sb-auth', value: 'tok' },
    ])
  })

  it('갱신이 없으면 최초 응답을 그대로 반환하고 request.cookies를 건드리지 않는다', async () => {
    const response = await createProxy()(fakeRequest())

    expect(mockState.responseInstances).toHaveLength(1)
    expect(response).toBe(mockState.responseInstances[0])
    expect(mockState.requestCookieSets).toEqual([])
  })

  it('P2-18/52: 세션 갱신 시 request.cookies에도 새 토큰을 쓴다 (같은 요청의 RSC가 새 토큰을 읽도록)', async () => {
    mockState.refreshOnGetUser = [
      { name: 'sb-auth', value: 'refreshed', options: { path: '/' } },
    ]
    await createProxy()(fakeRequest())

    expect(mockState.requestCookieSets).toEqual([
      { name: 'sb-auth', value: 'refreshed' },
    ])
  })

  it('P2-18/52: 갱신 후 응답을 갱신된 request로 재생성하고, 재생성된 응답에 쿠키를 써서 반환한다', async () => {
    mockState.refreshOnGetUser = [
      { name: 'sb-auth', value: 'refreshed', options: { path: '/' } },
    ]
    const request = fakeRequest()
    const response = await createProxy()(request)

    // 변이된 request로 응답 재생성 (공식 패턴: mutate → NextResponse.next({ request }))
    expect(mockState.responseInstances).toHaveLength(2)
    expect(mockState.responseInstances[1].init).toEqual({ request })
    // 반환되는 것은 재생성된 응답이고, Set-Cookie는 그 응답에 실린다
    expect(response).toBe(mockState.responseInstances[1])
    expect(mockState.responseInstances[0].setCookies).toEqual([])
    expect(mockState.responseInstances[1].setCookies).toEqual([
      { name: 'sb-auth', value: 'refreshed', options: { path: '/', domain: undefined } },
    ])
  })

  it('COOKIE_DOMAIN이 설정되면 그 도메인으로 응답 쿠키를 쓴다', async () => {
    vi.stubEnv('COOKIE_DOMAIN', '.example.test')
    await createProxy()(fakeRequest())

    mockState.clientArgs!.options.cookies.setAll([
      { name: 'sb-auth', value: 'new', options: { path: '/' } },
    ])

    const last = mockState.responseInstances[mockState.responseInstances.length - 1]
    expect(last.setCookies).toEqual([
      { name: 'sb-auth', value: 'new', options: { path: '/', domain: '.example.test' } },
    ])
  })

  it('COOKIE_DOMAIN 미설정 + production이면 .jisane.cloud로 폴백한다', async () => {
    vi.stubEnv('COOKIE_DOMAIN', '')
    vi.stubEnv('NODE_ENV', 'production')
    await createProxy()(fakeRequest())

    mockState.clientArgs!.options.cookies.setAll([
      { name: 'sb-auth', value: 'new', options: {} },
    ])

    const last = mockState.responseInstances[mockState.responseInstances.length - 1]
    expect(last.setCookies[0].options.domain).toBe('.jisane.cloud')
  })

  it('COOKIE_DOMAIN 미설정 + 비프로덕션이면 도메인을 지정하지 않는다', async () => {
    vi.stubEnv('COOKIE_DOMAIN', '')
    vi.stubEnv('NODE_ENV', 'test')
    await createProxy()(fakeRequest())

    mockState.clientArgs!.options.cookies.setAll([
      { name: 'sb-auth', value: 'new', options: {} },
    ])

    const last = mockState.responseInstances[mockState.responseInstances.length - 1]
    expect(last.setCookies[0].options.domain).toBeUndefined()
  })
})

describe('앱별 proxy.ts — 팩토리 래퍼 pinning', () => {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

  it.each(['admin', 'owner', 'expert'])(
    'apps/%s/proxy.ts는 createProxy 래퍼이고 인라인 구현이 없다',
    (app) => {
      const source = readFileSync(join(repoRoot, 'apps', app, 'proxy.ts'), 'utf8')

      expect(source).toContain("import { createProxy } from '@jisane/shared/proxy'")
      expect(source).toContain('export const proxy = createProxy()')
      // 사본 재유입 방지: 세션 갱신 구현이 앱 파일에 다시 들어오면 실패
      expect(source).not.toContain('createServerClient')
      // matcher 리터럴은 정적 분석 제약으로 앱 파일에 남아야 한다
      expect(source).toContain('matcher')
    }
  )
})
