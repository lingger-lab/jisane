/**
 * 회원 메시지 위험 스캔 — 순수 함수(I/O 없음, 단위테스트 대상).
 * 직거래 유도·외부연락처 교환 등 '정상 여부' 감사가 필요한 신호를 코드값으로 감지한다.
 * 원문을 복제 저장하지 않고 매칭된 사유 코드만 반환한다(회원 비노출은 저장계층이 담당).
 */

export type RiskReason = 'phone' | 'bank_account' | 'messenger' | 'email' | 'direct_deal'

const RISK_PATTERNS: readonly { reason: RiskReason; re: RegExp }[] = [
  // 휴대폰 번호(구분자 유무 무관). 날짜·일반 숫자와 구분되도록 010 접두 + 3~4/4자리 형태 요구.
  { reason: 'phone', re: /01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/ },
  // 계좌: 은행명+숫자열 또는 '계좌 + 번호/이체/입금' 문구
  {
    reason: 'bank_account',
    re: /(국민|신한|우리|하나|농협|기업|카카오뱅크|토스뱅크|새마을|우체국|산업|수협|씨티|SC|케이뱅크)[^\n]{0,10}\d{2,6}[-\s]?\d{2,6}[-\s]?\d{2,8}|계좌[^\n]{0,6}(번호|이체|입금)/,
  },
  // 외부 메신저 유도(카톡/오픈채팅/텔레그램/라인 아이디/위챗). '라인' 단독은 오탐이라 id 결합 요구.
  { reason: 'messenger', re: /카톡|카카오톡|오픈\s?채팅|open\.kakao\.com|텔레그램|텔레\s?아이디|라인\s?(아이디|id)|위챗|wechat/i },
  // 이메일
  { reason: 'email', re: /[\w.+-]+@[\w-]+\.[\w.]{2,}/ },
  // 직거래·수수료 회피·플랫폼 밖 연락 유도
  {
    reason: 'direct_deal',
    re: /직거래|직접\s?(거래|결제|입금)|현금으로|수수료\s?(없이|빼고|제외)|플랫폼\s?(밖|외)|따로\s?연락|개인적으로\s?연락/,
  },
]

/** 매칭된 위험 사유 코드 배열(중복 없음). 위험 없으면 빈 배열. */
export function scanMessageRisk(content: string): RiskReason[] {
  if (!content) return []
  const reasons: RiskReason[] = []
  for (const { reason, re } of RISK_PATTERNS) {
    if (re.test(content) && !reasons.includes(reason)) reasons.push(reason)
  }
  return reasons
}
