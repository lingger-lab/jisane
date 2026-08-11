import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// 회귀 가드: proxy 팩토리 추출(감사 docs/11 P3-74).
// 앱별 사본 3개를 createProxy() 단일 소스로 교체하면서
// (1) 세션 갱신 동작·쿠키 도메인 폴백이 사본과 동일한지,
// (2) 각 앱 proxy.ts가 인라인 구현 없이 팩토리의 얇은 래퍼인지 고정한다.

const mockState = {
  clientArgs: null as null | { url: string; key: string; options: any },
  getUserCalls: 0,
  responseCookies: [] as Array<{ name: string; value: string; options: any }>,
  responseInit: null as any,
}

vi.mock('@supabase/ssr', () => ({
  createServerClient: (url: string, key: string, options: any) => {
    mockState.clientArgs = { url, key, options }
    return {
      auth: {
        getUser: async () => {
          mockState.getUserCalls++
          return { data: { user: null }, error: null }
        },
      },
    }
  },
}))

vi.mock('next/server', () => ({
  NextResponse: {
    next: (init: any) => {
      mockState.responseInit = init
      return {
        cookies: {
          set: (name: string, value: string, options: any) => {
            mockState.responseCookies.push({ name, value, options })
          },
        },
      }
    },
  },
}))

import { createProxy } from './proxy'

const fakeRequest = () =>
  ({
    cookies: { getAll: () => [{ name: 'sb-auth', value: 'tok' }] },
  }) as any

beforeEach(() => {
  mockState.clientArgs = null
  mockState.getUserCalls = 0
  mockState.responseCookies = []
  mockState.responseInit = null
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

    expect(mockState.responseInit).toEqual({ request })
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

  it('COOKIE_DOMAIN이 설정되면 그 도메인으로 응답 쿠키를 쓴다', async () => {
    vi.stubEnv('COOKIE_DOMAIN', '.example.test')
    await createProxy()(fakeRequest())

    mockState.clientArgs!.options.cookies.setAll([
      { name: 'sb-auth', value: 'new', options: { path: '/' } },
    ])

    expect(mockState.responseCookies).toEqual([
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

    expect(mockState.responseCookies[0].options.domain).toBe('.jisane.cloud')
  })

  it('COOKIE_DOMAIN 미설정 + 비프로덕션이면 도메인을 지정하지 않는다', async () => {
    vi.stubEnv('COOKIE_DOMAIN', '')
    vi.stubEnv('NODE_ENV', 'test')
    await createProxy()(fakeRequest())

    mockState.clientArgs!.options.cookies.setAll([
      { name: 'sb-auth', value: 'new', options: {} },
    ])

    expect(mockState.responseCookies[0].options.domain).toBeUndefined()
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
