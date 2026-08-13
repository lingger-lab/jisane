export function OwlIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 귀깃 — 부드러운 봉우리 */}
      <path d="M13.5 14 Q11 6 17.5 11 Z" fill="currentColor" />
      <path d="M34.5 14 Q37 6 30.5 11 Z" fill="currentColor" />
      {/* 몸통 — 둥근 부엉이 실루엣 */}
      <path
        d="M24 8 C14.3 8 8.5 15.2 8.5 25.6 C8.5 35.8 15.2 42.5 24 42.5 C32.8 42.5 39.5 35.8 39.5 25.6 C39.5 15.2 33.7 8 24 8 Z"
        fill="currentColor"
      />
      {/* 얼굴 원반 — 살짝 밝은 하이라이트 */}
      <ellipse cx="24" cy="23.5" rx="14" ry="12.5" fill="#fbf9f3" opacity="0.08" />
      {/* 눈 — 크고 둥글게 */}
      <circle className="owl-eye" cx="17.6" cy="23" r="7" fill="#fbf9f3" />
      <circle className="owl-eye" cx="30.4" cy="23" r="7" fill="#fbf9f3" />
      <circle className="owl-eye owl-pupil" cx="17.6" cy="23.4" r="3.3" fill="#153f30" />
      <circle className="owl-eye owl-pupil" cx="30.4" cy="23.4" r="3.3" fill="#153f30" />
      {/* 눈 하이라이트 */}
      <circle cx="18.9" cy="22" r="1.05" fill="#fbf9f3" />
      <circle cx="31.7" cy="22" r="1.05" fill="#fbf9f3" />
      {/* 부리 — 작고 둥근 */}
      <path d="M24 28 L21.6 30.4 Q24 32.4 26.4 30.4 Z" fill="#b06a1e" />
      {/* 배 무늬 — 은은한 크림 */}
      <path d="M24 33 Q20.2 37 24 40.3 Q27.8 37 24 33 Z" fill="#fbf9f3" opacity="0.3" />
    </svg>
  )
}
