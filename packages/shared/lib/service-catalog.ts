/**
 * 전문서비스 카탈로그 — 타입 정의 전용.
 *
 * 데이터는 DB(service_package + provider)로 이관 완료 (마이그레이션 0025).
 * 조회는 `@jisane/shared/service-package/queries`(서버 전용)를 사용한다.
 * 과거 이곳에 있던 하드코딩 SERVICE_PACKAGES 배열·ENTERLABS_PROVIDER_ID 상수는
 * 파트너공간 리팩토링(PDCA-⑤)에서 제거됐다.
 */

/**
 * 기업(owner) 전문서비스 "5대 지원" 분류(pillar). category(3값 enum)와 별개 축으로,
 * owner 기업서비스에만 세팅된다(expert/education은 undefined). 랜딩 5카드·오너 서비스뷰 탭의 기준.
 */
export type EnterprisePillar =
  | 'biz_marketing'
  | 'finance_tax'
  | 'tech_quality'
  | 'online_sales'
  | 'ai_ax'

/** pillar 코드 → 한글 라벨 (랜딩 카드·탭·관리자폼 단일 소스) */
export const PILLAR_LABELS: Record<EnterprisePillar, string> = {
  biz_marketing: '경영·마케팅 사업화 지원',
  finance_tax: '재무·세무·회계 경영컨설팅',
  tech_quality: '기술·생산 품질관리 지원',
  online_sales: '온라인·홍보 판로개척 지원',
  ai_ax: 'AI·AX 지원',
}

/** 랜딩 카드 순서와 동일한 안정 정렬 순서 */
export const PILLAR_ORDER: EnterprisePillar[] = [
  'biz_marketing',
  'finance_tax',
  'tech_quality',
  'online_sales',
  'ai_ax',
]

export interface ServicePackage {
  /** service_package 테이블 PK — DB 조회 경로에서 채워짐 */
  id?: string
  slug: string
  category: 'ax_consulting' | 'biz_consulting' | 'education'
  /** 기업 5대 지원 분류 — owner 기업서비스만 세팅 */
  pillar?: EnterprisePillar
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

/**
 * 가격 표시 단일 규칙. 가격정책 미확정 서비스는 price=0 & isFree=false(sentinel) → "상담 문의".
 * 진짜 무료(isFree=true)는 "무료". 그 외는 원화 포맷.
 */
export function formatPackagePrice(pkg: Pick<ServicePackage, 'isFree' | 'price'>): string {
  if (pkg.isFree) return '무료'
  if (pkg.price > 0) return `${pkg.price.toLocaleString('ko-KR')}원`
  return '상담 문의'
}

/** 제공기관 정보 */
export interface ProviderInfo {
  id: string
  name: string
  packageCount: number
  freeCount: number
}
