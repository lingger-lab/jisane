'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ServiceBanner } from './service-banner'

/**
 * 지식서비스 배너 캐러셀 — 스킬샵 스타일(가로 스크롤·3장+다음 살짝 가림·‹›).
 * 프레젠테이션 전용(shared 미의존): 가격/카테고리 라벨은 호출처가 계산해 넘긴다.
 * 스냅 스크롤 + motion-safe(스무스는 reduced-motion에서 자동 해제) + 트랙 키보드 포커스.
 */
export interface ServiceCarouselItem {
  key: string
  href: string
  name: string
  provider: string
  bannerUrl?: string | null
  priceLabel: string
  categoryLabel?: string
  isOfficial?: boolean
  isFree?: boolean
}

export function ServiceCarousel({
  items,
  title,
  subtitle,
  seeAllHref,
}: {
  items: ServiceCarouselItem[]
  /** 생략 시 헤더 제목을 렌더하지 않음(호출처의 SectionHeader와 중복 방지). */
  title?: string
  subtitle?: string
  seeAllHref?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const update = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    update()
  }, [update, items.length])

  function scrollByCard(dir: 1 | -1) {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-card]')
    const dx = (card?.offsetWidth ?? el.clientWidth * 0.8) + 12
    el.scrollBy({ left: dir * dx, behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <section className="w-full" aria-roledescription="carousel" aria-label={title ?? '지식서비스'}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          {title && <h2 className="text-lg md:text-xl font-serif font-bold text-text">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {seeAllHref && (
            <a href={seeAllHref} className="text-sm font-medium text-primary hover:underline">
              전체 보기
            </a>
          )}
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label="이전"
              className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-text-muted transition-colors hover:bg-surface disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label="다음"
              className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-text-muted transition-colors hover:bg-surface disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={update}
        tabIndex={0}
        role="group"
        aria-label={`${title} 목록`}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 motion-safe:scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it) => (
          <a
            key={it.key}
            data-card=""
            href={it.href}
            className="group w-[80%] shrink-0 snap-start overflow-hidden rounded-xl border border-border-light bg-card shadow-xs card-hover transition-colors hover:border-primary/30 sm:w-[46%] lg:w-[30.5%]"
          >
            <div className="relative">
              <ServiceBanner src={it.bannerUrl} alt={it.name} className="rounded-none" />
              <div className="absolute left-2 top-2 flex gap-1">
                {it.isOfficial && (
                  <span className="rounded bg-primary/90 px-1.5 py-0.5 text-[11px] font-medium text-white">지사네 공식</span>
                )}
                {it.isFree && (
                  <span className="rounded bg-accent/90 px-1.5 py-0.5 text-[11px] font-medium text-white">무료</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 p-4">
              <h3 className="truncate font-semibold text-text">{it.name}</h3>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-text-subtle">
                  {it.categoryLabel ? `${it.categoryLabel} · ` : ''}
                  {it.provider}
                </span>
                <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{it.priceLabel}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
