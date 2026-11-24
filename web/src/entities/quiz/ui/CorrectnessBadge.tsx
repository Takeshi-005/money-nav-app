/**
 * Quiz Entity - CorrectnessBadge
 * 正解/不正解バッジコンポーネント
 */

export interface CorrectnessBadgeProps {
  isCorrect: boolean
}

export function CorrectnessBadge({ isCorrect }: CorrectnessBadgeProps) {
  if (isCorrect) {
    return (
      <span className="px-2 py-1 rounded text-xs font-medium bg-(--color-positive-100) text-(--color-positive-700)">
        正解
      </span>
    )
  }

  return (
    <span className="px-2 py-1 rounded text-xs font-medium bg-(--color-negative-100) text-(--color-negative-700)">
      不正解
    </span>
  )
}
