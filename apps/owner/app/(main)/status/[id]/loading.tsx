export default function StatusDetailLoading() {
  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8">
      {/* 뒤로가기 */}
      <div className="mb-4 h-4 w-16 animate-pulse rounded bg-border-light" />

      {/* 제목 + 상태 */}
      <div className="mb-2 h-7 w-2/3 animate-pulse rounded-lg bg-border-light" />
      <div className="mb-6 h-3 w-1/3 animate-pulse rounded bg-border-light" />

      {/* 프로그레스 바 */}
      <div className="mb-6 h-10 animate-pulse rounded-xl bg-border-light" />

      {/* 상태 카드 */}
      <div className="mb-4 rounded-xl border border-border-light bg-surface p-4">
        <div className="mb-2 h-5 w-24 animate-pulse rounded bg-border-light" />
        <div className="mb-1 h-3 w-full animate-pulse rounded bg-border-light" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-border-light" />
      </div>

      {/* 추가 콘텐츠 */}
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-border-light bg-surface"
          />
        ))}
      </div>
    </div>
  )
}
