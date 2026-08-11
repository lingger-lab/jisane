// 전문 분야 — category 테이블(대분류별 중분류)과 동기.
// 등록(register)과 프로필 편집(profile-editor)이 공유하는 단일 소스.
// 두 화면이 서로 다른 목록을 쓰면(과거 편집기의 축약 목록) 저장된 값 중 편집기에 없는 항목이
// 칩으로 렌더되지 않아 보이지도·해제되지도 않은 채 재저장되는 고아값이 생긴다(감사 docs/11 P1-6).
// 트리 자체는 @jisane/shared/categories CATEGORY_TREE가 단일 소스(감사 P2-40) —
// 여기서는 기존 소비처가 쓰는 { label, fields } 형태로만 변환한다.
import { CATEGORY_TREE } from '@jisane/shared/categories'

export const FIELD_GROUPS = CATEGORY_TREE.map((g) => ({
  label: g.label,
  fields: g.children,
}))

/** 그룹을 평면화한 전체 유효 분야 목록 */
export const FIELD_LIST = FIELD_GROUPS.flatMap((g) => g.fields)
