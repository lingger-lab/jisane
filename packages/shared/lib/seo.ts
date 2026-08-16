import type { Metadata } from 'next'

/**
 * SEO/AEO 단일 소스 — 3앱(admin/owner/expert)이 공유하는 메타데이터·JSON-LD 빌더.
 * canonical 기준 URL·OG 이미지·검색엔진 소유확인을 여기서 일원화한다(metadataBase 리터럴 중복 제거).
 */

export type AppKey = 'admin' | 'owner' | 'expert'

interface SiteConfig {
  baseUrl: string
  siteName: string
}

export const SITES: Record<AppKey, SiteConfig> = {
  admin: { baseUrl: 'https://jisane.cloud', siteName: '지사네 — 지역 기업의 든든한 성장 파트너' },
  owner: { baseUrl: 'https://owner.jisane.cloud', siteName: '지사네 기업회원' },
  expert: { baseUrl: 'https://expert.jisane.cloud', siteName: '지사네 시니어지식인회원' },
}

export const BRAND = '지사네'
export const LEGAL_NAME = '(주)지사네'
export const CONTACT_EMAIL = 'iamblackwhite86@gmail.com'
export const AREA_SERVED = ['부산광역시', '울산광역시', '경상남도']
export const LOCALE = 'ko_KR'
/** 소셜 미리보기 기본 이미지 — 각 앱 public 폴더에 존재(2848×1496, OG 1.91:1 비율) */
export const DEFAULT_OG = '/jisane-og-image.png'
const OG_WIDTH = 2848
const OG_HEIGHT = 1496
/** 정사각 로고(Organization logo용) — apps/admin/public */
const LOGO = `${SITES.admin.baseUrl}/jisane-app-icon-512.png`

/** 검색엔진 소유확인 — env 있을 때만 메타 방출(구글+네이버 서치어드바이저) */
function verification(): Metadata['verification'] {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  const naver = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
  const v: { google?: string; other?: Record<string, string | number> } = {}
  if (google) v.google = google
  if (naver) v.other = { 'naver-site-verification': naver }
  return Object.keys(v).length ? v : undefined
}

/** 루트 layout 메타데이터 — metadataBase·title template·기본 OG·verification */
export function rootMetadata(
  app: AppKey,
  opts: { titleDefault: string; description: string; image?: string }
): Metadata {
  const site = SITES[app]
  const image = opts.image ?? DEFAULT_OG
  return {
    metadataBase: new URL(site.baseUrl),
    title: { default: opts.titleDefault, template: `%s | ${BRAND}` },
    description: opts.description,
    alternates: { canonical: '/' },
    openGraph: {
      title: opts.titleDefault,
      description: opts.description,
      url: site.baseUrl,
      siteName: BRAND,
      locale: LOCALE,
      type: 'website',
      images: [{ url: image, width: OG_WIDTH, height: OG_HEIGHT, alt: opts.titleDefault }],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.titleDefault,
      description: opts.description,
      images: [image],
    },
    verification: verification(),
  }
}

/** 개별 공개 페이지 메타데이터 — 짧은 title(템플릿 적용)·description·canonical·OG */
export function pageMetadata(
  app: AppKey,
  opts: { title: string; description: string; path: string; image?: string }
): Metadata {
  const site = SITES[app]
  const image = opts.image ?? DEFAULT_OG
  const ogTitle = `${opts.title} | ${BRAND}`
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      title: ogTitle,
      description: opts.description,
      url: `${site.baseUrl}${opts.path}`,
      siteName: BRAND,
      locale: LOCALE,
      type: 'website',
      images: [{ url: image, width: OG_WIDTH, height: OG_HEIGHT, alt: opts.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: opts.description,
      images: [image],
    },
  }
}

// ─────────────────────────── JSON-LD 빌더 ───────────────────────────
// 순수 객체 반환 — <JsonLd data={...} />(@jisane/ui/json-ld)로 렌더한다.

/** 조직 — 검색 리치결과·지식패널·AEO 사실 앵커. RAG 상담 제공을 description에 명시. */
export function orgJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND,
    legalName: LEGAL_NAME,
    url: SITES.admin.baseUrl,
    logo: LOGO,
    image: `${SITES.admin.baseUrl}${DEFAULT_OG}`,
    description:
      '부울경(부산·울산·경남) 중소기업을 위한 전문 서비스와 시니어 전문가 정보를 제공하는 지식나눔 사업협력 네트워크. 온사이트 AI(RAG) 상담을 제공합니다.',
    areaServed: AREA_SERVED,
    contactPoint: {
      '@type': 'ContactPoint',
      email: CONTACT_EMAIL,
      contactType: 'customer support',
      areaServed: 'KR',
      availableLanguage: 'Korean',
    },
    sameAs: [SITES.owner.baseUrl, SITES.expert.baseUrl],
  }
}

/** 웹사이트 */
export function websiteJsonLd(app: AppKey) {
  const site = SITES[app]
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.siteName,
    url: site.baseUrl,
    inLanguage: 'ko-KR',
    publisher: { '@type': 'Organization', name: BRAND },
  }
}

/** 서비스 목록(ItemList of Service) */
export function serviceListJsonLd(services: { name: string; description: string; url?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: services.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: s.name,
        description: s.description,
        provider: { '@type': 'Organization', name: BRAND },
        areaServed: AREA_SERVED.join(', '),
        ...(s.url ? { url: s.url } : {}),
      },
    })),
  }
}

/** FAQ — AEO 핵심(답변엔진·리치결과). llms.txt·RAG와 동일 Q&A 단일 소스로 사용. */
export function faqJsonLd(qas: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qas.map((x) => ({
      '@type': 'Question',
      name: x.q,
      acceptedAnswer: { '@type': 'Answer', text: x.a },
    })),
  }
}

/** 브레드크럼 — 중첩 공개 페이지 */
export function breadcrumbJsonLd(app: AppKey, items: { name: string; path: string }[]) {
  const base = SITES[app].baseUrl
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${base}${it.path}`,
    })),
  }
}
