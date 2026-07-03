'use server'

import { redirect } from 'next/navigation'
import { approveDealOp, confirmDealOp, requestRevisionOp } from '@jisane/shared/deal/deal-operations'

export async function approveDeal(dealId: string): Promise<{ error?: string }> {
  const result = await approveDealOp(dealId)
  if (result.error) return { error: result.error }
  redirect(`/status/${result.requestId}?success=deal_approved`)
}

export async function confirmDeal(dealId: string): Promise<{ error?: string }> {
  const result = await confirmDealOp(dealId)
  if (result.error) return { error: result.error }
  redirect(`/status/${result.requestId}?success=deal_confirmed`)
}

export async function requestRevision(dealId: string, reason: string): Promise<{ error?: string }> {
  const result = await requestRevisionOp(dealId, reason)
  if (result.error) return { error: result.error }
  return {}
}
