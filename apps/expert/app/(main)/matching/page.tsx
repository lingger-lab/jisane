import { redirect } from 'next/navigation'

// 대시보드가 홈(/)으로 승격됨 — /matching은 홈으로 리다이렉트.
// 매칭 상세는 /matching/[id]에서 계속 제공.
export default function MatchingListPage() {
  redirect('/')
}
