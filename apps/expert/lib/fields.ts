// 전문 분야 = 평면 12분류 (category 테이블 depth 0과 동기).
// 등록(register)과 프로필 편집(profile-editor)이 공유하는 단일 소스.
// 트리 단일 소스는 @jisane/shared/categories CATEGORY_LABELS — 여기서는 재노출만 한다.
import { CATEGORY_LABELS } from '@jisane/shared/categories'

/** 선택 가능한 전체 전문 분야(12) */
export const FIELD_LIST: readonly string[] = CATEGORY_LABELS
