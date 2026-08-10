import { OwlIcon } from './icons/owl'

/**
 * 페이지 전환 시 표시되는 공용 브랜드 로더.
 * 레이아웃 약속(스켈레톤)을 하지 않고 콘텐츠 영역 중앙에 딥그린 부엉이 펄스만
 * 띄워, 폼·글·리스트 등 어떤 페이지 위에서도 어긋남 없이 안정감을 준다.
 * loading.tsx에서 default로 재사용. (페이지 전용 스켈레톤이 있는 곳은 그것이 우선)
 */
export default function RouteLoading() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3 min-h-[60vh] px-4 py-16 animate-fade-in"
      role="status"
      aria-busy="true"
    >
      <span className="route-loading-owl text-primary">
        <OwlIcon className="h-11 w-11" />
      </span>
      <p className="text-sm text-text-muted">불러오는 중…</p>
      <span className="sr-only">페이지를 불러오는 중입니다</span>
    </div>
  )
}
