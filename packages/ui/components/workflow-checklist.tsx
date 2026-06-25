import type { DealWorkflowRow, WorkflowStep, StepStatus } from '@jisane/shared/types'

const STEP_LABELS: Record<WorkflowStep, string> = {
  intake: '요건 수집',
  structure: '구조화',
  generate: '작업 수행',
  verify: '검증',
  deliver: '납품',
}

const STATUS_STYLES: Record<StepStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-surface', text: 'text-text-subtle', label: '대기' },
  in_progress: { bg: 'bg-warning-light', text: 'text-warning', label: '진행 중' },
  done: { bg: 'bg-success-light', text: 'text-success', label: '완료' },
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
            className="flex items-center gap-3 rounded-xl border border-border-light p-3 shadow-xs"
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
