import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isOwnBannerUrl } from './banner'

// banner_url 저장 전 경로 검증 — 임의 URL·타인 배너 주입 차단(보안 게이트)
const BASE = 'https://proj.supabase.co'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', BASE)
})
afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isOwnBannerUrl', () => {
  const pid = 'prov-1'
  const own = `${BASE}/storage/v1/object/public/service-banners/banners/${pid}/abc.webp`

  it('null·빈값은 허용(배너 미설정/제거)', () => {
    expect(isOwnBannerUrl(null, pid)).toBe(true)
    expect(isOwnBannerUrl(undefined, pid)).toBe(true)
    expect(isOwnBannerUrl('', pid)).toBe(true)
  })

  it('본인 provider 경로는 허용', () => {
    expect(isOwnBannerUrl(own, pid)).toBe(true)
  })

  it('다른 provider 경로는 거부', () => {
    const other = `${BASE}/storage/v1/object/public/service-banners/banners/prov-2/x.webp`
    expect(isOwnBannerUrl(other, pid)).toBe(false)
  })

  it('임의 외부/다른 버킷 URL은 거부', () => {
    expect(isOwnBannerUrl('https://evil.example.com/x.webp', pid)).toBe(false)
    expect(isOwnBannerUrl(`${BASE}/storage/v1/object/public/other-bucket/banners/${pid}/x.webp`, pid)).toBe(false)
  })
})
