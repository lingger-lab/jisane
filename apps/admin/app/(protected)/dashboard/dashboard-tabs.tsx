'use client'

import { useState, type ReactNode } from 'react'

const TABS = [
  { key: 'matching', label: '매칭 대기' },
  { key: 'proposed', label: '매칭 진행' },
  { key: 'progress', label: '진행 중' },
  { key: 'settlement', label: '정산 관리' },
  { key: 'service', label: '서비스 주문' },
  { key: 'inquiry', label: '문의' },
] as const

type TabKey = (typeof TABS)[number]['key']

interface DashboardTabsProps {
  matchingTab: ReactNode
  proposedTab: ReactNode
  progressTab: ReactNode
  settlementTab: ReactNode
  serviceTab: ReactNode
  inquiryTab: ReactNode
}

export function DashboardTabs({ matchingTab, proposedTab, progressTab, settlementTab, serviceTab, inquiryTab }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('matching')

  return (
    <div>
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-surface p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-accent text-white'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'matching' && matchingTab}
      {activeTab === 'proposed' && proposedTab}
      {activeTab === 'progress' && progressTab}
      {activeTab === 'settlement' && settlementTab}
      {activeTab === 'service' && serviceTab}
      {activeTab === 'inquiry' && inquiryTab}
    </div>
  )
}
