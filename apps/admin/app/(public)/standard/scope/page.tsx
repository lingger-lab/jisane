export const metadata = {
  title: '용역 명세서 | 지사네 거래 표준',
  description: '지사네 용역 명세서 양식 — 착수 전에 범위를 동사와 숫자로 못 박습니다.',
}

export default function ScopePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-xs font-semibold text-primary tracking-wide mb-2">거래 표준 문서 ①</p>
      <h1 className="text-2xl font-bold text-text mb-2">지사네 용역 명세서</h1>
      <p className="text-xs text-text-subtle mb-8">초안 v1.0 · 오해 제거 5대 메커니즘 ② 범위 실물화</p>

      <div className="rounded-xl bg-surface-warm p-4 mb-8 text-sm text-text-muted leading-relaxed">
        <p className="font-semibold text-text mb-1">이 문서는 왜 존재하나요?</p>
        <p>
          오해의 90%는 &ldquo;해줄 줄 알았는데&rdquo;에서 나옵니다.
          이 명세서는 착수 전에 발주자와 전문가가 함께 확인하고 서명합니다.
          &ldquo;이건 합니다 / 이건 안 합니다&rdquo;를 명문화해,
          끝나고 &ldquo;그건 안 했잖아요&rdquo;가 생길 자리를 없앱니다.
        </p>
        <p className="mt-2 font-semibold text-text">
          작성 원칙 — 형용사 금지, 동사와 숫자로만.
        </p>
        <p>
          &ldquo;꼼꼼히 해드립니다&rdquo;가 아니라 &ldquo;3회 수정 포함&rdquo;.
          모호함이 곧 오해입니다.
        </p>
      </div>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-text-muted">
        {/* 1. 거래 기본 정보 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-text">1. 거래 기본 정보</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <tbody className="text-text-muted">
                {[
                  '용역명',
                  '발주자 (성함/상호)',
                  '수행 전문가',
                  '계약 체결일',
                  '착수일 ~ 완료일',
                ].map((label) => (
                  <tr key={label} className="border-b border-border-light">
                    <td className="py-2.5 pr-4 font-medium text-text w-40">{label}</td>
                    <td className="py-2.5 text-text-subtle">________________________________</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. 업무 범위 — 이건 합니다 */}
        <section>
          <h2 className="mb-1 text-base font-semibold text-text">2. 업무 범위 — 이건 합니다</h2>
          <p className="mb-3">수행할 업무를 동사로 구체적으로 적습니다. 산출물·수량·형식을 명시합니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-2 text-left font-semibold text-text w-8">#</th>
                  <th className="py-2 pr-4 text-left font-semibold text-text">수행 업무 (동사로)</th>
                  <th className="py-2 pr-4 text-left font-semibold text-text">산출물/형식</th>
                  <th className="py-2 text-left font-semibold text-text">수량·횟수</th>
                </tr>
              </thead>
              <tbody className="text-text-muted">
                {[1, 2, 3, 4].map((n) => (
                  <tr key={n} className="border-b border-border-light">
                    <td className="py-2.5 pr-2 text-text-subtle">{n}</td>
                    <td className="py-2.5 pr-4">—</td>
                    <td className="py-2.5 pr-4">—</td>
                    <td className="py-2.5">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. 제외 범위 — 이건 안 합니다 */}
        <section>
          <h2 className="mb-1 text-base font-semibold text-text">3. 제외 범위 — 이건 안 합니다</h2>
          <p className="mb-3">
            가장 중요한 칸입니다. 오해의 90%는 &ldquo;해줄 줄 알았는데&rdquo;에서 나옵니다.
            포함되지 않는 것을 미리 못 박습니다.
          </p>
          <ul className="flex flex-col gap-2 text-text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">(예)</span>
              인쇄·출력물 제작은 포함되지 않음
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">(예)</span>
              완료 후 30일 경과 시 추가 수정은 별도 계약
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">(예)</span>
              제3자 저작권·라이선스 비용은 발주자 부담
            </li>
          </ul>
          <p className="mt-3 text-text-subtle">추가 제외 항목 ________________________________</p>
        </section>

        {/* 4. 수정·검수 조건 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-text">4. 수정·검수 조건</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-semibold text-text">항목</th>
                  <th className="py-2 text-left font-semibold text-text">조건</th>
                </tr>
              </thead>
              <tbody className="text-text-muted">
                <tr className="border-b border-border-light">
                  <td className="py-2.5 pr-4 font-medium text-text">무료 수정 횟수</td>
                  <td className="py-2.5">______ 회 (초과 시 회당 ______ 원)</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2.5 pr-4 font-medium text-text">검수 기간</td>
                  <td className="py-2.5">산출물 전달 후 ______ 일 이내</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-text">검수 방법</td>
                  <td className="py-2.5">______ (예: 카카오·이메일 확인)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. 대금 및 지급 (에스크로) */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-text">5. 대금 및 지급 (에스크로)</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <tbody className="text-text-muted">
                <tr className="border-b border-border-light">
                  <td className="py-2.5 pr-4 font-medium text-text w-44">총 용역 대금</td>
                  <td className="py-2.5">________________________________</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2.5 pr-4 font-medium text-text">지사네 중개 수수료율</td>
                  <td className="py-2.5">7단계 등급표 기준 · 사전 공개</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            대금은 토스페이먼츠 에스크로에 보관되며, 발주자의 검수 완료 확인 후 전문가에게 지급됩니다.
            <br />
            <span className="font-medium text-text">착수 전 예치 → 완료 확인 → 지급.</span>
          </p>
        </section>

        {/* 6. 서명 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-text">6. 서명</h2>
          <p className="mb-4">
            아래 서명으로 위 범위에 상호 동의합니다.
            <br />
            <span className="font-medium text-text">이 문서에 없는 업무는 본 계약의 범위가 아닙니다.</span>
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border-light p-4">
              <p className="text-xs font-semibold text-text mb-2">발주자</p>
              <p className="text-text-subtle">성명: ________</p>
              <p className="text-text-subtle mt-1">서명: ________</p>
              <p className="text-text-subtle mt-1">일자: ____ . ____ . ____</p>
            </div>
            <div className="rounded-xl border border-border-light p-4">
              <p className="text-xs font-semibold text-text mb-2">전문가</p>
              <p className="text-text-subtle">성명: ________</p>
              <p className="text-text-subtle mt-1">서명: ________</p>
              <p className="text-text-subtle mt-1">일자: ____ . ____ . ____</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
