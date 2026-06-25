import type { RequestStatus, DealStatus } from '@jisane/shared/types'

const STEPS = [
  { key: 'received', label: '접수' },
  { key: 'matching', label: '매칭' },
  { key: 'working', label: '작업' },
  { key: 'done', label: '완료' },
] as const

function getActiveStep(requestStatus: RequestStatus, dealStatus?: DealStatus | null): number {
  if (requestStatus === 'closed') return 3
  if (dealStatus === 'done') return 3
  if (dealStatus === 'working') return 2
  if (dealStatus === 'quoted') return 2
  if (requestStatus === 'dealt') return 2
  if (requestStatus === 'matching') return 1
  return 0 // open
}

interface ProgressBarProps {
  requestStatus: RequestStatus
  dealStatus?: DealStatus | null
}

export function ProgressBar({ requestStatus, dealStatus }: ProgressBarProps) {
  const activeStep = getActiveStep(requestStatus, dealStatus)

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full items-center">
            <div
              className={`h-2 w-full rounded-full transition-colors ${
                i <= activeStep ? 'bg-accent' : 'bg-border-light'
              }`}
            />
          </div>
          <span
            className={`text-xs ${
              i <= activeStep ? 'font-semibold text-text' : 'text-text-muted'
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}
