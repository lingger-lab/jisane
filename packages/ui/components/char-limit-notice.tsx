/**
 * 입력 길이 상한 안내 (감사 docs/10 T22 — 캡 no-op).
 *
 * maxLength는 상한에서 추가 입력·붙여넣기 초과분을 아무 피드백 없이 버린다.
 * 상한의 90% 이전에는 아무것도 렌더하지 않아 평상시엔 소음이 없고, 근접하면
 * 카운터를, 도달하면 상한 안내를 보여준다. length는 입력의 maxLength와 같은
 * max 값으로 호출할 것.
 */
export function CharLimitNotice({ length, max }: { length: number; max: number }) {
  if (length < max * 0.9) return null
  const atMax = length >= max
  return (
    <p
      role="status"
      aria-live="polite"
      className={`mb-1 text-right text-xs ${atMax ? 'font-medium text-warning' : 'text-text-muted'}`}
    >
      {atMax
        ? `최대 ${max.toLocaleString('ko-KR')}자까지 입력할 수 있습니다`
        : `${length.toLocaleString('ko-KR')}/${max.toLocaleString('ko-KR')}자`}
    </p>
  )
}
