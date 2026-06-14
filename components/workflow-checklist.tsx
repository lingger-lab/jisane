import type { DealWorkflowRow, WorkflowStep, StepStatus } from '@/lib/types'

const STEP_LABELS: Record<WorkflowStep, string> = {
  intake: '요건 수집',
  structure: '구조화',
  generate: '작업 수행',
  verify: '검증',
  deliver: '납품',
}

const STATUS_STYLES: Record<StepStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-500', label: '대기' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '진행 중' },
  done: { bg: 'bg-green-100', text: 'text-green-700', label: '완료' },
}

interface WorkflowChecklistProps {
  steps: DealWorkflowRow[]
}

export function WorkflowChecklist({ steps }: WorkflowChecklistProps) {
  const orderedSteps: WorkflowStep[] = ['intake', 'structure', 'generate', 'verify', 'deliver']

  return (
    <div className="flex flex-col gap-2">
      {orderedSteps.map((stepKey, i) => {
        const wf = steps.find((s) => s.step === stepKey)
        const status = wf?.status || 'pending'
        const style = STATUS_STYLES[status]

        return (
          <div
            key={stepKey}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-text-muted">
              {i + 1}
            </span>
            <span className="flex-1 text-sm font-medium text-text">
              {STEP_LABELS[stepKey]}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
            >
              {style.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
