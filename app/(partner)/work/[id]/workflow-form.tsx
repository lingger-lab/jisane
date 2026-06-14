'use client'

import { useState } from 'react'
import { updateWorkflowStep } from '@/lib/workflow/actions'
import type { DealWorkflowRow, WorkflowStep, StepStatus } from '@/lib/types'

const STEP_LABELS: Record<WorkflowStep, string> = {
  intake: '요건 수집',
  structure: '구조화',
  generate: '작업 수행',
  verify: '검증',
  deliver: '납품',
}

const ORDERED_STEPS: WorkflowStep[] = ['intake', 'structure', 'generate', 'verify', 'deliver']

interface WorkflowFormProps {
  dealId: string
  steps: DealWorkflowRow[]
}

export function WorkflowForm({ dealId, steps }: WorkflowFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [localSteps, setLocalSteps] = useState(steps)

  async function handleToggle(step: WorkflowStep, currentStatus: StepStatus) {
    let newStatus: StepStatus
    if (currentStatus === 'pending') {
      newStatus = 'in_progress'
    } else if (currentStatus === 'in_progress') {
      newStatus = 'done'
    } else {
      return // already done
    }

    // 낙관적 업데이트
    setLocalSteps((prev) =>
      prev.map((s) =>
        s.step === step
          ? { ...s, status: newStatus, done_at: newStatus === 'done' ? new Date().toISOString() : s.done_at }
          : s
      )
    )

    const result = await updateWorkflowStep(dealId, step, newStatus)
    if (result.error) {
      setError(result.error)
      // 롤백
      setLocalSteps((prev) =>
        prev.map((s) => (s.step === step ? { ...s, status: currentStatus } : s))
      )
    } else {
      setError(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="mb-2 text-xs text-accent">{error}</p>}
      {ORDERED_STEPS.map((stepKey, i) => {
        const wf = localSteps.find((s) => s.step === stepKey)
        const status = wf?.status || 'pending'

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

            {status === 'done' ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                완료
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleToggle(stepKey, status)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  status === 'pending'
                    ? 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-green-100 hover:text-green-700'
                }`}
              >
                {status === 'pending' ? '시작' : '완료'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
