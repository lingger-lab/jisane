export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  // 하단 탭은 root layout에서 전역 렌더 (로그인 전후 공통)
  return <div className="flex flex-1 flex-col">{children}</div>
}
