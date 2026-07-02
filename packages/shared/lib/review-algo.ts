/**
 * AI 평가 점수 산정 로직
 *
 * 3개 평가축:
 * - 진행과정 (process): 워크플로우 완료 속도, 일정 준수
 * - 결과물 (result): 검수 통과, 수정 요청 횟수, 사장님 만족도
 * - 대응도 (response): 메시지 응답 속도, 커뮤니케이션 빈도
 *
 * 관리자가 최종 확정 (AI는 제안만)
 */

export interface AiRatingInput {
  deal: {
    due_date: string | null
    created_at: string
    status: string
  }
  workflows: Array<{
    step: string
    status: string
    created_at: string
    updated_at: string
  }>
  messages: Array<{
    sender_type: string
    created_at: string
  }>
  clientReview: {
    rating: number
    comment: string | null
  } | null
}

export interface AiRatingResult {
  process_rating: number
  result_rating: number
  response_rating: number
  overall_rating: number
  reasoning: string
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** AI 평가 점수 산정 */
export function calculateAiRating(input: AiRatingInput): AiRatingResult {
  const reasons: string[] = []

  // 1. 진행과정 (process_rating)
  const doneSteps = input.workflows.filter((w) => w.status === 'done').length
  const totalSteps = input.workflows.length || 5
  const completionRate = doneSteps / totalSteps

  let processRating = 3
  if (completionRate >= 1.0) processRating = 5
  else if (completionRate >= 0.8) processRating = 4
  else if (completionRate >= 0.6) processRating = 3
  else if (completionRate >= 0.4) processRating = 2
  else processRating = 1

  // 일정 준수 보정
  if (input.deal.due_date && input.deal.status === 'done') {
    const due = new Date(input.deal.due_date).getTime()
    const lastWorkflow = input.workflows
      .filter((w) => w.status === 'done')
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
    if (lastWorkflow) {
      const finished = new Date(lastWorkflow.updated_at).getTime()
      const diffDays = (finished - due) / (1000 * 60 * 60 * 24)
      if (diffDays <= 0) {
        processRating = Math.min(5, processRating + 1)
        reasons.push('기한 내 완료')
      } else if (diffDays > 3) {
        processRating = Math.max(1, processRating - 1)
        reasons.push(`기한 ${Math.round(diffDays)}일 초과`)
      }
    }
  }
  reasons.push(`${totalSteps}단계 중 ${doneSteps}단계 완료`)
  processRating = clamp(processRating, 1, 5)

  // 2. 결과물 (result_rating)
  let resultRating = 3

  if (input.clientReview) {
    resultRating = input.clientReview.rating
    reasons.push(`사장님 평점 ${input.clientReview.rating}점`)
  } else if (input.deal.status === 'done') {
    resultRating = 4
    reasons.push('검수 완료 (사장님 리뷰 미등록)')
  }
  resultRating = clamp(resultRating, 1, 5)

  // 3. 대응도 (response_rating)
  let responseRating = 3
  const partnerMessages = input.messages.filter((m) => m.sender_type === 'partner')
  const clientMessages = input.messages.filter((m) => m.sender_type === 'client')

  if (clientMessages.length > 0 && partnerMessages.length > 0) {
    // 평균 응답 시간 계산 (간이 추정)
    const totalMessages = input.messages.length
    if (totalMessages >= 10) {
      responseRating = 5
      reasons.push(`총 ${totalMessages}건 소통`)
    } else if (totalMessages >= 5) {
      responseRating = 4
      reasons.push(`총 ${totalMessages}건 소통`)
    } else {
      responseRating = 3
      reasons.push(`총 ${totalMessages}건 소통`)
    }
  } else if (partnerMessages.length === 0 && clientMessages.length > 0) {
    responseRating = 1
    reasons.push('파트너 응답 없음')
  } else {
    responseRating = 3
    reasons.push('메시지 데이터 부족')
  }
  responseRating = clamp(responseRating, 1, 5)

  // 4. 종합 (가중 평균)
  const overall = Math.round(
    processRating * 0.3 + resultRating * 0.4 + responseRating * 0.3
  )
  const overallRating = clamp(overall, 1, 5)

  return {
    process_rating: processRating,
    result_rating: resultRating,
    response_rating: responseRating,
    overall_rating: overallRating,
    reasoning: reasons.join('. '),
  }
}
