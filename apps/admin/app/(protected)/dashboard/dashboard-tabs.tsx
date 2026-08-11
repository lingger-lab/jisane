'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { nextRovingIndex, rovingTabIndex } from '@jisane/ui/roving-focus'

const TAB_GROUPS = [
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

type TabKey = (typeof TAB_GROUPS)[number]['tabs'][number]['key']

// 화살표 로빙 이동용 평탄화 목록 (그룹 구분과 무관하게 좌우 이동)
const FLAT_TABS: readonly { key: TabKey; label: string }[] = TAB_GROUPS.flatMap((g) => [
  ...g.tabs,
])

interface DashboardTabsProps {
  matchingTab: ReactNode
  proposedTab: ReactNode
  progressTab: ReactNode
  invitationTab: ReactNode
  settlementTab: ReactNode
  disputeTab: ReactNode
  serviceTab: ReactNode
  partnerTab: ReactNode
  inquiryTab: ReactNode
  urgentCount: number
  auditCount: number
}

export function DashboardTabs({
  matchingTab,
  proposedTab,
  progressTab,
  invitationTab,
  settlementTab,
  disputeTab,
  serviceTab,
  partnerTab,
  inquiryTab,
  urgentCount,
  auditCount,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('matching')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const activeIndex = FLAT_TABS.findIndex((t) => t.key === activeTab)

  // WAI-ARIA APG tabs 패턴 — 수동 활성화: 화살표는 포커스만 이동, Enter/Space로 전환
  function handleTabKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = nextRovingIndex(e.key, index, FLAT_TABS.length)
    if (next === null) return
    e.preventDefault()
    tabRefs.current[next]?.focus()
  }

  return (
    <div>
      {/* 긴급도 배너 */}
      {(urgentCount > 0 || auditCount > 0) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {urgentCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('dispute')}
              className="flex items-center gap-1.5 rounded-lg border border-error/30 bg-error/5 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-error" />
              즉시 처리 {urgentCount}건
            </button>
          )}
          {auditCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('settlement')}
              className="flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/5 px-3 py-1.5 text-xs font-medium text-warning transition-colors hover:bg-warning/10"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-warning" />
              검토 대기 {auditCount}건
            </button>
          )}
        </div>
      )}

      {/* 4그룹 탭 */}
      <div
        role="tablist"
        aria-label="관리 대시보드 섹션"
        className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-surface p-1"
      >
        {TAB_GROUPS.map((group, gi) => (
          <div key={group.label} role="presentation" className="flex items-center">
            {gi > 0 && <div aria-hidden="true" className="mx-0.5 h-6 w-px shrink-0 bg-border" />}
            <div role="presentation" className="flex gap-0.5">
              {group.tabs.map((tab) => {
                const flatIndex = FLAT_TABS.findIndex((t) => t.key === tab.key)
                return (
                  <button
                    key={tab.key}
                    ref={(el) => {
                      tabRefs.current[flatIndex] = el
                    }}
                    type="button"
                    role="tab"
                    id={`tab-${tab.key}`}
                    aria-selected={activeTab === tab.key}
                    aria-controls={`tabpanel-${tab.key}`}
                    tabIndex={rovingTabIndex(flatIndex, activeIndex)}
                    onClick={() => setActiveTab(tab.key)}
                    onKeyDown={(e) => handleTabKeyDown(e, flatIndex)}
                    className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-accent text-white'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'matching' && matchingTab}
        {activeTab === 'proposed' && proposedTab}
        {activeTab === 'progress' && progressTab}
        {activeTab === 'invitation' && invitationTab}
        {activeTab === 'settlement' && settlementTab}
        {activeTab === 'dispute' && disputeTab}
        {activeTab === 'service' && serviceTab}
        {activeTab === 'partner' && partnerTab}
        {activeTab === 'inquiry' && inquiryTab}
      </div>
    </div>
  )
}
