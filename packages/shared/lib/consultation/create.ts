import 'server-only'
import { adminClient } from '../supabase/admin'
import { notifyAdmin } from '../notify/email'
import { CONSENT_VERSION, validateInquiry, type InquiryFormInput } from './validate'

/** 접수 대상 서비스·회원 컨텍스트(서버에서 신뢰가능한 값으로 채워 전달). */
export interface InquiryContext {
  packageId?: string | null
  packageSlug?: string | null
  packageName?: string | null
  category?: string | null
  providerId?: string | null
  ownerId?: string | null
  expertId?: string | null
}

export type CreateInquiryResult = { ok: true } | { ok: false; error: string }

const RATE_LIMIT_MS = 60_000 // 동일 번호 60초 내 재접수 차단(중복·기초 남용 방지)

/**
 * 상담문의 접수 — 검증 → rate-limit → insert → 동의 원장 기록 → 관리자 통지.
 * 허니팟 스팸은 성공한 척(ok:true) 반환해 봇에 힌트를 주지 않는다.
 * 모든 쓰기는 service-role(adminClient) 경유 — consultation_inquiry/consent_log는 RLS 정책 없음.
 */
export async function createConsultationInquiry(
  input: InquiryFormInput,
  ctx: InquiryContext,
): Promise<CreateInquiryResult> {
  const v = validateInquiry(input)
  if (!v.ok) {
    if (v.spam) return { ok: true } // 허니팟: 조용히 성공 처리
    return { ok: false, error: v.error }
  }
  const { name, phone, detail, marketingConsent } = v.value

  // rate-limit: 동일 번호 최근 접수 시각 확인
  const { data: recent } = await adminClient
    .from('consultation_inquiry')
    .select('created_at')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
  if (recent && recent[0]) {
    const elapsed = Date.now() - new Date(recent[0].created_at as string).getTime()
    if (elapsed < RATE_LIMIT_MS) {
      return { ok: false, error: '방금 접수하셨습니다. 잠시 후 다시 시도해주세요.' }
    }
  }

  const now = new Date().toISOString()
  const { data: inserted, error } = await adminClient
    .from('consultation_inquiry')
    .insert({
      name,
      phone,
      detail,
      service_package_id: ctx.packageId ?? null,
      package_slug: ctx.packageSlug ?? null,
      package_name: ctx.packageName ?? null,
      category: ctx.category ?? null,
      provider_id: ctx.providerId ?? null,
      owner_id: ctx.ownerId ?? null,
      expert_id: ctx.expertId ?? null,
      privacy_consent_at: now,
      marketing_consent_at: marketingConsent ? now : null,
      consent_version: CONSENT_VERSION,
    })
    .select('id')
    .single()

  if (error || !inserted) {
    return { ok: false, error: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }

  // 동의 원장(append-only) — 필수 동의 + (선택 시) 마케팅 동의
  const consentBase = {
    phone,
    owner_id: ctx.ownerId ?? null,
    expert_id: ctx.expertId ?? null,
    inquiry_id: inserted.id as string,
    version: CONSENT_VERSION,
    source: 'inquiry_form',
    action: 'granted' as const,
  }
  const consentRows: Array<typeof consentBase & { item: string }> = [
    { ...consentBase, item: 'privacy_consult' },
  ]
  if (marketingConsent) consentRows.push({ ...consentBase, item: 'marketing_kakao' })
  const { error: consentErr } = await adminClient.from('consent_log').insert(consentRows)
  if (consentErr) console.error('[consultation] consent_log insert failed:', consentErr.message)

  // 관리자 통지(fire-and-forget — 실패해도 접수 흐름 비차단)
  await notifyAdmin(
    `새 상담 접수 · ${ctx.packageName ?? '일반 문의'}`,
    `이름: ${name}\n연락처: ${phone}\n` +
      (detail ? `내용: ${detail}\n` : '') +
      `마케팅 수신: ${marketingConsent ? '동의' : '미동의'}\n` +
      `관리자 대시보드 '상담 접수' 탭에서 확인하세요.`,
  )

  return { ok: true }
}
