'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
      <span className="text-3xl">&#9888;</span>
      <div>
        <h2 className="text-lg font-bold text-text">대시보드를 불러올 수 없습니다</h2>
        <p className="mt-1 text-sm text-text-muted">
          {error.message || '알 수 없는 오류가 발생했습니다.'}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
      >
        다시 시도
      </button>
    </div>
  )
}
