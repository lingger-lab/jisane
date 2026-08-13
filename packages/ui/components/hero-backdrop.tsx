/**
 * 히어로 앰비언트 백드롭 — .hero-dark 딥그린 밴드 위에 얹는 장식 레이어.
 * 브랜드 그린/앰버 블러 블롭이 천천히 드리프트 + 옅은 라이트 스윕(hero 강도만).
 * 순수 CSS 애니메이션(GPU transform/opacity) → 서버 컴포넌트로 충분하고,
 * reduced-motion은 globals.css @media 가드가 정지시킨다(JS 불필요).
 *
 * 사용: .hero-dark 컨테이너(position:relative overflow:hidden) 첫 자식으로 두고,
 * 실제 콘텐츠 <section>은 `relative z-10`으로 위에 얹는다.
 *
 * - intensity: 'hero'(랜딩 — 블롭+스윕) | 'subtle'(내부 PageHero — 더 옅게, 스윕 생략)
 */
export function HeroBackdrop({ intensity = 'hero' }: { intensity?: 'hero' | 'subtle' }) {
  return (
    <div className="hero-backdrop" data-intensity={intensity} aria-hidden="true">
      <span className="hero-blob hero-blob-1" />
      <span className="hero-blob hero-blob-2" />
      <span className="hero-blob hero-blob-3" />
      {intensity === 'hero' && <span className="hero-sweep" />}
    </div>
  )
}
