export interface ServicePackage {
  slug: string
  category: 'ax_consulting' | 'biz_consulting' | 'education'
  name: string
  description: string
  price: number
  deliverables: string[]
  duration?: string
  axDashboardUrl?: string
  targetAudience: 'owner' | 'partner'
  featured?: boolean
}

export const SERVICE_PACKAGES: ServicePackage[] = [
  // ── AX 컨설팅 (Owner용) ──────────────────────────
  {
    slug: 'ax-diagnosis-free',
    category: 'ax_consulting',
    name: 'AX 무료 진단',
    description:
      'AX 5대 적용축(업무자동화·의사결정·리스크관리·마케팅·고객응대) 기반 진단. 비용 절감·수익 향상 포인트를 찾아 최우선 1곳으로 좁힙니다.',
    price: 0,
    deliverables: ['AX 5대 적용축 진단 리포트', '5가치 기반 우선순위 선정', '첫 AI 실험 계획서'],
    duration: '1주',
    axDashboardUrl: '/ax-process',
    targetAudience: 'owner',
    featured: true,
  },
  {
    slug: 'ax-coaching',
    category: 'ax_consulting',
    name: 'AX 전환 코칭',
    description:
      '구현의 사다리(챗봇→업무자동화→AI Agent)를 따라 작게 시작, 효과 측정, 확장까지 동행합니다. 자체 LLM/RAG 설계 포함.',
    price: 500000,
    deliverables: ['AI 도구 1개 적용 실험', '비용 절감·수익 향상 효과 측정 리포트', '자체 LLM/RAG 검토 보고서', '확장 로드맵'],
    duration: '1개월',
    axDashboardUrl: '/ax-process',
    targetAudience: 'owner',
  },
  {
    slug: 'lead-diagnosis',
    category: 'ax_consulting',
    name: 'AI 사업 진단',
    description:
      'Claude AI 기반 사업 진단. AX 5가치(비용절감·수익향상·리스크감소·신규수익모델·고객만족) 관점에서 맞춤 전환 전략을 제공합니다.',
    price: 200000,
    deliverables: ['AX 5가치 기반 AI 진단 카드', 'AX 적용축 매핑 보고서', '분기별 실행 로드맵'],
    duration: '3일',
    axDashboardUrl: '/ax',
    targetAudience: 'owner',
  },

  // ── 경영 컨설팅 (Owner용) ─────────────────────────
  {
    slug: 'biz-plan-writing',
    category: 'biz_consulting',
    name: '사업계획서 작성',
    description:
      'AI 기반 사업계획서 자동생성 + 전문가 검수. 40개 질문 응답으로 완성.',
    price: 300000,
    deliverables: ['사업계획서 (DOCX/PDF)', '전문가 검수 코멘트'],
    duration: '1주',
    targetAudience: 'owner',
  },
  {
    slug: 'gov-subsidy-application',
    category: 'biz_consulting',
    name: '정부지원사업 신청대행',
    description:
      '50건+ 정부과제 경험. 지원사업 선별 + 신청서 작성 + 제출 대행.',
    price: 1000000,
    deliverables: ['지원사업 매칭 리포트', '신청서 완성본', '제출 대행'],
    duration: '2주',
    targetAudience: 'owner',
  },
  {
    slug: 'biz-diagnosis',
    category: 'biz_consulting',
    name: '경영진단',
    description:
      '제1원칙 프레임워크 기반 사업 분석. 전제 파헤치기 → 근본 원리 → 실행 로드맵.',
    price: 500000,
    deliverables: ['6단계 분석 보고서 (DOCX)', '실행 로드맵', '30일 액션플랜'],
    duration: '2주',
    targetAudience: 'owner',
  },

  // ── 교육 (Partner용) ──────────────────────────────
  {
    slug: 'ai-tools-workshop',
    category: 'education',
    name: 'AI 도구 워크숍',
    description:
      '비개발자를 위한 AI 코딩 환경 셋업 + 실습. Claude, Cursor, 바이브코딩 기초.',
    price: 100000,
    deliverables: ['실습 환경 셋업', '핸즈온 가이드 (15~20p)', '수료증'],
    duration: '3시간',
    targetAudience: 'partner',
  },
  {
    slug: 'content-pipeline-course',
    category: 'education',
    name: '콘텐츠 파이프라인 과정',
    description:
      'AX 5스킬 콘텐츠 파이프라인 — 신호 수집 → 뉴스레터 → AEO 블로그 → 서사 → 숏폼.',
    price: 300000,
    deliverables: ['5스킬 실습', '개인 파이프라인 셋업', '수료증'],
    duration: '2일',
    targetAudience: 'partner',
  },
  {
    slug: 'prompt-engineering',
    category: 'education',
    name: '프롬프트 엔지니어링 기초',
    description:
      'CoT, ToT, ReAct 등 검증 기법 조합. 최적화 프롬프트 설계 능력 습득.',
    price: 150000,
    deliverables: ['실습 워크북', '프롬프트 템플릿 10종', '수료증'],
    duration: '3시간',
    targetAudience: 'partner',
  },
]

export function getPackageBySlug(slug: string): ServicePackage | undefined {
  return SERVICE_PACKAGES.find((p) => p.slug === slug)
}

export function getPackagesByCategory(
  category: ServicePackage['category']
): ServicePackage[] {
  return SERVICE_PACKAGES.filter((p) => p.category === category)
}

export function getPackagesByAudience(
  audience: ServicePackage['targetAudience']
): ServicePackage[] {
  return SERVICE_PACKAGES.filter((p) => p.targetAudience === audience)
}
