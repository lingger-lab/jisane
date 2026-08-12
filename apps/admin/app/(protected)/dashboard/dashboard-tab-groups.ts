/**
 * 대시보드 탭 구성 — 탭바(dashboard-tabs.tsx)와 로딩 스켈레톤(loading.tsx)이 공유하는
 * 단일 소스. 스켈레톤의 탭 개수가 실제 탭바와 어긋나 데이터 도착 시 리플로우하던
 * 드리프트를 원천 차단한다(감사 docs/10 P3-5).
 */
export const TAB_GROUPS = [
  {
    label: '거래',
    tabs: [
      { key: 'matching', label: '매칭 대기' },
      { key: 'proposed', label: '매칭 진행' },
      { key: 'progress', label: '진행 중' },
      { key: 'invitation', label: '초빙' },
    ],
  },
  {
    label: '신뢰',
    tabs: [{ key: 'settlement', label: '정산 관리' }],
  },
  {
    label: '분쟁·보증',
    tabs: [{ key: 'dispute', label: '이의제기' }],
  },
  {
    label: '지원',
    tabs: [
      { key: 'service', label: '서비스 주문' },
      { key: 'partner', label: '전문가회원' },
      { key: 'inquiry', label: '문의' },
    ],
  },
] as const

export type TabKey = (typeof TAB_GROUPS)[number]['tabs'][number]['key']

// 화살표 로빙 이동용 평탄화 목록 (그룹 구분과 무관하게 좌우 이동)
export const FLAT_TABS: readonly { key: TabKey; label: string }[] = TAB_GROUPS.flatMap((g) => [
  ...g.tabs,
])
