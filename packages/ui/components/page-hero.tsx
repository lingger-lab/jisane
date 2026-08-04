import type { ReactNode } from 'react'

/**
 * 페이지 공용 헤더 — 브랜드 딥그린 다크 밴드(hero-dark).
 * 모든 내부 페이지 상단을 이 컴포넌트로 통일한다. 히어로엔 제목만, 액션·CTA는 밝은 본문에 둔다.
 *
 * - title: 제목(흰 글씨). highlight 문자열이 title에 포함되면 그 부분만 앰버(accent-light) 강조.
 * - eyebrow: 상단 작은 pill 라벨(옵션).
 * - subtitle: 부제(옵션).
 * - back: 좌상단 뒤로가기 링크 노드(옵션).
 * - size: 'md'(기본) | 'lg'(마케팅/랜딩성 큰 제목).
 */
export function PageHero({
  eyebrow,
  title,
  highlight,
  subtitle,
  back,
  size = 'md',
}: {
  eyebrow?: string
  title: string
  highlight?: string
  subtitle?: string
  back?: ReactNode
  size?: 'md' | 'lg'
}) {
  const titleClass =
    size === 'lg'
      ? 'text-2xl md:text-3xl lg:text-4xl'
      : 'text-xl md:text-2xl'

  // highlight가 title에 있으면 그 부분만 accent-light 스팬으로 분리
  let titleNode: ReactNode = title
  if (highlight && title.includes(highlight)) {
    const [before, after] = title.split(highlight)
    titleNode = (
      <>
        {before}
        <span className="text-accent-light">{highlight}</span>
        {after}
      </>
    )
  }

  return (
    <div className="hero-dark w-full">
      <section className={`responsive-container flex flex-col gap-1.5 px-4 md:px-6 ${size === 'lg' ? 'pt-10 md:pt-14 pb-8 md:pb-10' : 'pt-8 md:pt-10 pb-6 md:pb-8'}`}>
        {back && <div className="mb-1">{back}</div>}
        {eyebrow && <span className="hero-eyebrow self-start">{eyebrow}</span>}
        <h1 className={`${titleClass} font-bold font-serif text-white leading-snug`}>
          {titleNode}
        </h1>
        {subtitle && <p className="text-sm md:text-base text-white/80">{subtitle}</p>}
      </section>
    </div>
  )
}
