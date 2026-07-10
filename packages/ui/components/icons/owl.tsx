export function OwlIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="26" r="17" fill="currentColor" />
      <circle cx="18" cy="22" r="6" fill="#fbf9f3" />
      <circle cx="30" cy="22" r="6" fill="#fbf9f3" />
      <circle cx="18" cy="22" r="2.6" fill="#153f30" />
      <circle cx="30" cy="22" r="2.6" fill="#153f30" />
      <path d="M21 27 L24 30 L27 27 Z" fill="#b06a1e" />
      <path
        d="M14 10 Q18 15 21 17 M34 10 Q30 15 27 17"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
