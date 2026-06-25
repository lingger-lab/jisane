import type { ManagerName } from '@jisane/shared/types'

interface EscalationResult {
  escalateTo: ManagerName
  category: string
}

const ESCALATION_RULES: { keywords: string[]; manager: ManagerName; category: string }[] = [
  {
    keywords: ['정부', '지원', '보조금', '바우처', '공공', '정책', '사업비'],
    manager: 'park',
    category: '정부지원',
  },
  {
    keywords: ['기술', '시스템', '오류', '버그', '접속', '로그인', '앱'],
    manager: 'kim',
    category: '기술',
  },
  {
    keywords: ['분쟁', '신고', '사기', '피해', '법률', '고소'],
    manager: 'park',
    category: '분쟁',
  },
]

/**
 * 에스컬레이션 담당자 결정
 * 키워드 기반으로 적합한 매니저와 카테고리를 반환
 * 매칭 실패 시 brad(기본 담당)
 */
export function determineEscalation(question: string): EscalationResult {
  const normalized = question.toLowerCase()

  for (const rule of ESCALATION_RULES) {
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword)) {
        return { escalateTo: rule.manager, category: rule.category }
      }
    }
  }

  return { escalateTo: 'brad', category: '기타' }
}
