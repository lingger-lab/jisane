'use client'

import { useState, type ReactNode } from 'react'

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
      { key: 'inquiry', label: '문의' },
    ],
  },
] as const

type TabKey = (typeof TAB_GROUPS)[number]['tabs'][number]['key']

interface DashboardTabsProps {
  matchingTab: ReactNode
  proposedTab: ReactNode
  progressTab: ReactNode
  invitationTab: ReactNode
  settlementTab: ReactNode
  disputeTab: ReactNode
  serviceTab: ReactNode
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
  inquiryTab,
  urgentCount,
  auditCount,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('matching')

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
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-surface p-1">
        {TAB_GROUPS.map((group, gi) => (
          <div key={group.label} className="flex items-center">
            {gi > 0 && <div className="mx-0.5 h-6 w-px shrink-0 bg-border" />}
            <div className="flex gap-0.5">
              {group.tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-accent text-white'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'matching' && matchingTab}
      {activeTab === 'proposed' && proposedTab}
      {activeTab === 'progress' && progressTab}
      {activeTab === 'invitation' && invitationTab}
      {activeTab === 'settlement' && settlementTab}
      {activeTab === 'dispute' && disputeTab}
      {activeTab === 'service' && serviceTab}
      {activeTab === 'inquiry' && inquiryTab}
    </div>
  )
}
