export default function StatusLoading() {
  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8">
      {/* 헤더 */}
      <div className="mb-5">
        <div className="mb-1 h-6 w-28 animate-pulse rounded-lg bg-border-light" />
        <div className="h-3 w-40 animate-pulse rounded bg-border-light" />
      </div>

      {/* 요약 카드 2개 */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border-light bg-surface-warm p-4 text-center"
          >
            <div className="mx-auto mb-1 h-8 w-10 animate-pulse rounded-lg bg-border-light" />
            <div className="mx-auto h-3 w-16 animate-pulse rounded bg-border-light" />
          </div>
        ))}
      </div>

      {/* CTA 버튼 */}
      <div className="mb-6 h-12 animate-pulse rounded-xl bg-border-light" />

      {/* 의뢰 목록 */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border-light bg-surface p-4"
          >
            <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-border-light" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-border-light" />
          </div>
        ))}
      </div>
    </div>
  )
}
