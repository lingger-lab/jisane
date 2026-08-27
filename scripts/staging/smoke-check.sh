#!/usr/bin/env bash
# 스테이징 배포 후 스모크 점검 — 3앱 도달성 + 핵심 라우트 + 감지 마커.
# 실행: OWNER=... EXPERT=... ADMIN=... bash scripts/staging/smoke-check.sh
#   (env 미지정 시 스테이징 기본 도메인 사용)
set -u

OWNER="${OWNER:-https://owner.staging.jisane.cloud}"
EXPERT="${EXPERT:-https://expert.staging.jisane.cloud}"
ADMIN="${ADMIN:-https://staging.jisane.cloud}"

pass=0; fail=0
chk() { # chk <설명> <url> [기대문자열]
  local desc="$1" url="$2" needle="${3:-}"
  local code body
  code=$(curl -s -o /tmp/smoke_body -w "%{http_code}" -m 20 "$url" 2>/dev/null)
  body=$(cat /tmp/smoke_body 2>/dev/null)
  if [ "$code" = "200" ] && { [ -z "$needle" ] || echo "$body" | grep -q "$needle"; }; then
    echo "  ✅ $desc ($code)"; pass=$((pass+1))
  else
    echo "  ❌ $desc ($code)${needle:+  마커 '$needle' 없음}"; fail=$((fail+1))
  fi
}

echo "== 도달성 =="
chk "owner 홈"   "$OWNER"
chk "expert 홈"  "$EXPERT"
chk "admin 홈"   "$ADMIN"

echo "== 핵심 공개 라우트 =="
chk "회원가입 유형선택 /join"        "$ADMIN/join" "회원가입"
chk "/join?from 유도 배너"           "$ADMIN/join?from=owner" "아직 가입된 회원이 아닙니다"
chk "개인정보처리방침"               "$ADMIN/privacy" "개인정보처리방침"
chk "전문서비스 안내"                "$ADMIN/service"
chk "owner 서비스 둘러보기"          "$OWNER/services"

echo "== 결과 =="
echo "  통과 $pass · 실패 $fail"
[ "$fail" -eq 0 ] || { echo "  ⚠️ 실패 항목 확인 필요(대개 env/Redirect URLs/배포 롤아웃)"; exit 1; }
echo "  스모크 통과 — 로그인·매칭·결제 등 인증 플로우는 E2E(스테이징)로 검증."
