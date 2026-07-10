export const metadata = {
  title: '책임 적립금 운영 규정 | 지사네 거래 표준',
  description: '지사네 책임 적립금 운영 규정 — 문제가 생기면 고객보다 지사네가 먼저 움직입니다.',
}

export default function GuaranteePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-xs font-semibold text-primary tracking-wide mb-2">거래 표준 문서 ②</p>
      <h1 className="text-2xl font-bold text-text mb-2">지사네 책임 적립금 운영 규정</h1>
      <p className="text-xs text-text-subtle mb-8">초안 v1.0 · 오해 제거 5대 메커니즘 ⑤ 복구 실물화</p>

      <div className="rounded-xl bg-surface-warm p-4 mb-8 text-sm text-text-muted leading-relaxed">
        <p className="font-semibold text-text mb-1">이 규정은 왜 존재하나요?</p>
        <p>
          문제가 생겼을 때 고객이 항의하기 전에 지사네가 먼저 보전하는 구조를 명문화합니다.
          외부 보험이 아니라 지사네가 직접 쌓아 직접 책임지는 내부 준비금입니다.
        </p>
        <p className="mt-2 font-semibold text-text">
          핵심 성격 — 이것은 &ldquo;믿어주세요&rdquo;라는 말이 아니라, 믿을 수 있는 구조입니다.
        </p>
      </div>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-text-muted">
        {/* 제1조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-text">제1조 (목적)</h2>
          <p>
            본 규정은 지사네를 통한 용역 거래에서 발생할 수 있는 손해를,
            지사네가 자체 적립한 준비금으로 신속히 보전하기 위한
            기준과 절차를 정함을 목적으로 합니다.
          </p>
        </section>

        {/* 제2조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-text">제2조 (적립 방식)</h2>
          <ul className="flex flex-col gap-2">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              지사네는 각 거래의 중개 수수료 중 <span className="font-medium text-text">10%</span>를
              책임 적립금으로 적립합니다.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              적립금은 지사네 운영 자금과 분리된 별도 계정으로 관리합니다.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              적립금 잔액은 분기별로 커뮤니티에 공개합니다. (투명성 원칙)
            </li>
          </ul>
        </section>

        {/* 제3조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-text">제3조 (보전 대상)</h2>
          <p className="mb-3">다음의 경우 적립금에서 우선 보전합니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-2 text-left font-semibold text-text w-8">#</th>
                  <th className="py-2 pr-4 text-left font-semibold text-text">보전 대상 상황</th>
                  <th className="py-2 text-left font-semibold text-text">보전 한도</th>
                </tr>
              </thead>
              <tbody className="text-text-muted">
                <tr className="border-b border-border-light">
                  <td className="py-2.5 pr-2 text-text-subtle">1</td>
                  <td className="py-2.5 pr-4">
                    전문가가 명세서 범위를 이행했으나 결과에 하자가 있는 경우
                  </td>
                  <td className="py-2.5">대금의 일정% 한도</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2.5 pr-2 text-text-subtle">2</td>
                  <td className="py-2.5 pr-4">
                    전문가 사정으로 용역이 중단된 경우
                  </td>
                  <td className="py-2.5">예치 대금 환급 + 재매칭</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2.5 pr-2 text-text-subtle">3</td>
                  <td className="py-2.5 pr-4">
                    검수 분쟁으로 대금 지급이 지연되는 경우
                  </td>
                  <td className="py-2.5">분쟁 조정 기간 대금 보관</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-2 text-text-subtle">4</td>
                  <td className="py-2.5 pr-4">
                    기타 지사네가 중개 책임을 인정하는 경우
                  </td>
                  <td className="py-2.5">건별 심사</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제4조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-text">제4조 (선제 보전 원칙)</h2>
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
            <p className="font-medium text-text">
              지사네는 고객의 정식 항의 접수 여부와 무관하게,
              하자·중단 정황을 인지하는 즉시 발주자에게 먼저 통지하고
              보전 절차를 개시합니다.
            </p>
            <p className="mt-2 font-semibold text-primary">먼저 알리고, 먼저 처리합니다.</p>
          </div>
        </section>

        {/* 제5조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-text">제5조 (보전 절차)</h2>
          <ol className="flex flex-col gap-2 list-decimal pl-5">
            <li>정황 인지 (지사네 모니터링 또는 당사자 신고)</li>
            <li>48시간 내 양 당사자에게 통지 및 사실 확인</li>
            <li>보전 여부·한도 심사 (제3조 기준)</li>
            <li>적립금에서 보전 집행 및 결과 통지</li>
            <li>보전 내역 기록 및 분기 공개 반영</li>
          </ol>
        </section>

        {/* 제6조 */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-text">제6조 (한계 및 제외)</h2>
          <p className="mb-3 font-medium text-text">
            본 적립금은 무한 배상 보험이 아닙니다.
          </p>
          <p className="mb-2">다음은 보전 대상에서 제외합니다.</p>
          <ul className="flex flex-col gap-2">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">&mdash;</span>
              발주자가 명세서 범위 외 결과를 요구하며 발생한 분쟁
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">&mdash;</span>
              천재지변·불가항력에 의한 손해
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">&mdash;</span>
              당사자 간 지사네 외부에서 이루어진 별도 합의로 인한 손해
            </li>
          </ul>
          <p className="mt-3">
            적립금 잔액을 초과하는 손해는 별도 협의하며,
            지사네는 재매칭·조정 등 비금전적 복구를 함께 제공합니다.
          </p>
        </section>

        {/* 원칙 요약 */}
        <section className="rounded-xl border border-border-light bg-white p-4 shadow-xs">
          <p className="text-sm font-semibold text-text text-center">
            범위는 착수 전에 못 박고, 복구는 항의 전에 먼저 움직인다.
          </p>
          <p className="mt-1 text-xs text-text-muted text-center">
            이 두 문서가 지사네의 약속을 실물로 지탱합니다.
          </p>
        </section>
      </div>
    </div>
  )
}
