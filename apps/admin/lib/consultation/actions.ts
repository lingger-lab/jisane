'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'

export const CONSULTATION_STATUSES = [
  'received',
  'assigned',
  'in_progress',
  'done',
  'on_hold',
  'spam',
] as const
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number]

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  received: '접수',
  assigned: '배정',
  in_progress: '상담중',
  done: '완료',
  on_hold: '보류',
  spam: '스팸',
}

/** 접수 담당자(거버넌스: 관리자 3인). 별도 admin 테이블이 없어 상수로 관리. */
export const CONSULTATION_ASSIGNEES = ['박희중', 'BRAD', 'DANNY'] as const

function isStatus(v: string): v is ConsultationStatus {
  return (CONSULTATION_STATUSES as readonly string[]).includes(v)
}

export async function setConsultationStatus(id: string, status: string): Promise<{ error?: string }> {
  if (!(await verifyAdmin())) return { error: '권한이 없습니다.' }
  if (!isStatus(status)) return { error: '잘못된 상태입니다.' }
  const { error } = await adminClient
    .from('consultation_inquiry')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: '상태 변경에 실패했습니다.' }
  revalidatePath('/dashboard')
  return {}
}

export async function setConsultationAssignee(id: string, assignee: string): Promise<{ error?: string }> {
  if (!(await verifyAdmin())) return { error: '권한이 없습니다.' }
  const value = assignee.trim() || null
  // 배정하면 상태를 최소 'assigned'로 승격(이미 진행/완료면 유지)
  const { data: cur } = await adminClient
    .from('consultation_inquiry')
    .select('status')
    .eq('id', id)
    .single()
  const nextStatus =
    value && cur && (cur.status as string) === 'received' ? 'assigned' : (cur?.status as string | undefined)
  const { error } = await adminClient
    .from('consultation_inquiry')
    .update({ assigned_admin: value, status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: '담당자 배정에 실패했습니다.' }
  revalidatePath('/dashboard')
  return {}
}

export async function setConsultationNote(id: string, note: string): Promise<{ error?: string }> {
  if (!(await verifyAdmin())) return { error: '권한이 없습니다.' }
  const { error } = await adminClient
    .from('consultation_inquiry')
    .update({ admin_note: note.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: '메모 저장에 실패했습니다.' }
  revalidatePath('/dashboard')
  return {}
}
