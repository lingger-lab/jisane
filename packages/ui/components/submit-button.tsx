'use client'

import { useFormStatus } from 'react-dom'

interface SubmitButtonProps {
  children: React.ReactNode
  className?: string
}

export function SubmitButton({ children, className }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`btn-press focus-ring ${className}`}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          처리 중...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
