import Link from 'next/link'

export const metadata = {
  title: '개인정보처리방침 | 지사네',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="mb-8 inline-block text-sm text-text-muted hover:text-text transition-colors">
        &larr; 홈으로
      </Link>

      <h1 className="text-2xl font-bold text-text mb-2">개인정보처리방침</h1>
      <p className="text-xs text-text-subtle mb-8">시행일: 2025년 6월 15일</p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-3 text-base font-semibold text-text">1. 개인정보의 수집 및 이용 목적</h2>
          <p>
            (주)지사네(이하 &quot;회사&quot;)는 &quot;지사네&quot; 서비스(이하 &quot;서비스&quot;) 제공을 위해
            다음의 목적으로 개인정보를 수집·이용합니다.
          </p>
          <ul className="mt-2 list-disc pl-5 flex flex-col gap-1">
            <li>회원 가입 및 본인 확인</li>
            <li>의뢰 등록, 매칭, 계약 체결 등 서비스 제공</li>
            <li>파트너 검증 및 신뢰도 평가</li>
            <li>결제 및 정산 처리</li>
            <li>고객 문의 응대 및 공지사항 전달</li>
            <li>서비스 개선 및 통계 분석</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-text">2. 수집하는 개인정보 항목</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-semibold text-text">구분</th>
                  <th className="py-2 pr-4 text-left font-semibold text-text">수집 항목</th>
                  <th className="py-2 text-left font-semibold text-text">수집 방법</th>
                </tr>
              </thead>
              <tbody className="text-text-muted">
                <tr className="border-b border-border-light">
                  <td className="py-2 pr-4">회원가입(필수)</td>
                  <td className="py-2 pr-4">이메일, 이름(닉네임), 프로필 사진</td>
                  <td className="py-2">카카오/Google OAuth</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2 pr-4">기업(의뢰인)</td>
                  <td className="py-2 pr-4">업종, 의뢰 내용, 연락처</td>
                  <td className="py-2">서비스 이용 중 입력</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2 pr-4">시니어</td>
                  <td className="py-2 pr-4">이름, 분야, 경력, 자기소개, 포트폴리오</td>
                  <td className="py-2">서비스 이용 중 입력</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2 pr-4">결제</td>
                  <td className="py-2 pr-4">결제 수단 정보, 거래 내역</td>
                  <td className="py-2">결제 시 자동 수집</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">자동 수집</td>
                  <td className="py-2 pr-4">접속 IP, 쿠키, 접속 일시, 기기 정보</td>
                  <td className="py-2">서비스 이용 시 자동</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-text">3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회사는 개인정보 수집·이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
            단, 관련 법령에 의해 보존이 필요한 경우 아래 기간 동안 보관합니다.
          </p>
          <ul className="mt-2 list-disc pl-5 flex flex-col gap-1">
            <li>계약 또는 청약 철회에 관한 기록: 5년 (전자상거래법)</li>
            <li>대금 결제 및 재화 공급에 관한 기록: 5년 (전자상거래법)</li>
            <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)</li>
            <li>접속 로그 기록: 3개월 (통신비밀보호법)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-text">4. 개인정보의 제3자 제공</h2>
          <p>
            회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
            다만, 다음의 경우에는 예외로 합니다.
          </p>
          <ul className="mt-2 list-disc pl-5 flex flex-col gap-1">
            <li>이용자가 사전에 동의한 경우</li>
            <li>의뢰-파트너 매칭 시 계약 이행을 위해 필요한 최소한의 정보 (이름, 연락처)</li>
            <li>법령에 의하여 요구되는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-text">5. 개인정보 처리 위탁</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 text-left font-semibold text-text">수탁 업체</th>
                  <th className="py-2 text-left font-semibold text-text">위탁 업무</th>
                </tr>
              </thead>
              <tbody className="text-text-muted">
                <tr className="border-b border-border-light">
                  <td className="py-2 pr-4">Supabase Inc.</td>
                  <td className="py-2">회원 인증 및 데이터 저장</td>
                </tr>
                <tr className="border-b border-border-light">
                  <td className="py-2 pr-4">토스페이먼츠(주)</td>
                  <td className="py-2">결제 처리</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Vercel Inc.</td>
                  <td className="py-2">웹 서비스 호스팅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-text">6. 이용자의 권리와 행사 방법</h2>
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul className="mt-2 list-disc pl-5 flex flex-col gap-1">
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구</li>
            <li>처리 정지 요구</li>
          </ul>
          <p className="mt-2">
            위 권리 행사는 서비스 내 마이페이지 또는 이메일(iamblackwhite86@gmail.com)을 통해 가능하며,
            회사는 이에 대해 지체 없이 조치합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-text">7. 개인정보의 파기 절차 및 방법</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
            <li>종이 문서: 분쇄기로 분쇄 또는 소각</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-text">8. 쿠키의 사용</h2>
          <p>
            서비스는 로그인 세션 유지 및 사용자 역할 판별을 위해 쿠키를 사용합니다.
            브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 서비스 이용에 제한이 있을 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-text">9. 개인정보 보호책임자</h2>
          <ul className="list-none flex flex-col gap-1">
            <li><span className="text-text">회사명:</span> (주)지사네</li>
            <li><span className="text-text">사업자등록번호:</span> 405-02-46113</li>
            <li><span className="text-text">담당자:</span> 개인정보 보호책임자</li>
            <li><span className="text-text">이메일:</span> iamblackwhite86@gmail.com</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-text">10. 개인정보처리방침 변경</h2>
          <p>
            본 방침은 2025년 6월 15일부터 시행됩니다.
            내용이 변경될 경우 시행 7일 전부터 서비스 내 공지사항을 통해 안내합니다.
          </p>
        </section>
      </div>
    </div>
  )
}
