/**
 * Quiz Entity - QuizTypeBadge
 * クイズ種別バッジコンポーネント
 */

import { QUIZ_TYPE_LABELS } from "../model/constants"

export interface QuizTypeBadgeProps {
  quizType: string
}

export function QuizTypeBadge({ quizType }: QuizTypeBadgeProps) {
  return (
    <span className="px-2 py-1 rounded text-xs font-medium bg-surface-elevated text-(--text-secondary)">
      {QUIZ_TYPE_LABELS[quizType] || quizType}
    </span>
  )
}
