/**
 * Claude 심볼(선버스트) 근사 — 헤더의 Claude 바로가기 링크용. currentColor로 색 지정.
 * 외부 Claude(claude.ai)로 연결하는 링크에 쓰이는 인식용 마크.
 */
export function ClaudeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <line x1="12" y1="2.5" x2="12" y2="8" />
        <line x1="12" y1="2.5" x2="12" y2="8" transform="rotate(30 12 12)" />
        <line x1="12" y1="2.5" x2="12" y2="8" transform="rotate(60 12 12)" />
        <line x1="12" y1="2.5" x2="12" y2="8" transform="rotate(90 12 12)" />
        <line x1="12" y1="2.5" x2="12" y2="8" transform="rotate(120 12 12)" />
        <line x1="12" y1="2.5" x2="12" y2="8" transform="rotate(150 12 12)" />
        <line x1="12" y1="2.5" x2="12" y2="8" transform="rotate(180 12 12)" />
        <line x1="12" y1="2.5" x2="12" y2="8" transform="rotate(210 12 12)" />
        <line x1="12" y1="2.5" x2="12" y2="8" transform="rotate(240 12 12)" />
        <line x1="12" y1="2.5" x2="12" y2="8" transform="rotate(270 12 12)" />
        <line x1="12" y1="2.5" x2="12" y2="8" transform="rotate(300 12 12)" />
        <line x1="12" y1="2.5" x2="12" y2="8" transform="rotate(330 12 12)" />
      </g>
    </svg>
  )
}
