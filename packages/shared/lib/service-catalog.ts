/**
 * 전문서비스 카탈로그 — 타입 정의 전용.
 *
 * 데이터는 DB(service_package + provider)로 이관 완료 (마이그레이션 0025).
 * 조회는 `@jisane/shared/service-package/queries`(서버 전용)를 사용한다.
 * 과거 이곳에 있던 하드코딩 SERVICE_PACKAGES 배열·ENTERLABS_PROVIDER_ID 상수는
 * 파트너공간 리팩토링(PDCA-⑤)에서 제거됐다.
 */

export interface ServicePackage {
  /** service_package 테이블 PK — DB 조회 경로에서 채워짐 */
  id?: string
  slug: string
  category: 'ax_consulting' | 'biz_consulting' | 'education'
  name: string
  description: string
  price: number
  deliverables: string[]
  duration?: string
  axDashboardUrl?: string
  targetAudience: 'owner' | 'expert'
  featured?: boolean
  /** 제공기관 표시명 */
  provider: string
  /** provider 테이블 FK */
  providerId: string
  /** 랜딩용 가치 설명 (가격 대신 표시) */
  valueDesc: string
  /** 무료 여부 */
  isFree: boolean
}

/** 제공기관 정보 */
export interface ProviderInfo {
  id: string
  name: string
  packageCount: number
  freeCount: number
}
