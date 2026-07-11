export default function DashboardLoading() {
  return (
    <div className="px-4 py-5 sm:px-6 sm:py-8">
      {/* 제목 */}
      <div className="mb-6 h-7 w-24 animate-pulse rounded-lg bg-border-light" />

      {/* 요약 카드 7개 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border-light bg-surface p-4 text-center"
          >
            <div className="mx-auto mb-2 h-3 w-12 animate-pulse rounded bg-border-light" />
            <div className="mx-auto h-7 w-16 animate-pulse rounded-lg bg-border-light" />
          </div>
        ))}
      </div>

      {/* 탭 바 6개 */}
      <div className="mb-4 flex gap-1 rounded-lg bg-surface p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 flex-1 animate-pulse rounded-md bg-border-light"
          />
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-border-light bg-surface"
          />
        ))}
      </div>
    </div>
  )
}
