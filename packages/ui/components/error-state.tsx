/**
 * 쿼리 실패 전용 에러 상태 카드.
 *
 * 감사 docs/10 T2·docs/11 P2-21/36/43/44, P3-75: 쿼리 error가 빈 배열로 위장되어
 * "데이터 없음" 빈 상태와 구분 불가였다 — 실패한 섹션은 빈 상태 대신 이 카드를 렌더한다.
 * 기존 빈 상태 카드(rounded-xl·dashed·py-8·center)와 같은 시각 체계를 쓰되
 * 에러 토큰으로 구분하고, role="alert"(D2 커밋 e604c49의 에러 표기 패턴)를 준수한다.
 * 서버 컴포넌트에서 그대로 쓸 수 있게 인터랙션 없이 새로고침 유도 문구만 둔다.
 */
export function ErrorState({
  message = '목록을 불러오지 못했습니다.',
  hint = '잠시 후 새로고침해 다시 시도해주세요.',
  className = '',
}: {
  message?: string
  hint?: string
  className?: string
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-1.5 rounded-xl border border-error/30 bg-error-light px-4 py-8 text-center ${className}`}
    >
      <p className="text-sm font-medium text-error">{message}</p>
      <p className="text-xs text-text-muted">{hint}</p>
    </div>
  )
}
