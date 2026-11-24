/**
 * Quiz Entity - OptionItem
 * クイズ選択肢アイテムコンポーネント
 */

import { cn } from "@/shared/lib/utils"
import type { QuizOption } from "../model/types"

export interface OptionItemProps {
  option: QuizOption
  isUserAnswer: boolean
  isCorrectAnswer: boolean
  userAnswerCorrect: boolean
}

export function OptionItem({
  option,
  isUserAnswer,
  isCorrectAnswer,
  userAnswerCorrect,
}: OptionItemProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-xl flex items-center gap-3 border-2",
        isCorrectAnswer
          ? "bg-(--color-positive-50) border-(--color-positive-500)"
          : isUserAnswer && !userAnswerCorrect
            ? "bg-(--color-negative-50) border-(--color-negative-500)"
            : "bg-surface-elevated border-transparent"
      )}
    >
      <span
        className={cn(
          "text-sm",
          isCorrectAnswer
            ? "text-(--color-positive-700)"
            : isUserAnswer && !userAnswerCorrect
              ? "text-(--color-negative-700)"
              : "text-(--text-secondary)"
        )}
      >
        {option.text}
      </span>
      {isUserAnswer && (
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded",
            userAnswerCorrect
              ? "bg-(--color-positive-200) text-(--color-positive-800)"
              : "bg-(--color-negative-200) text-(--color-negative-800)"
          )}
        >
          あなたの回答
        </span>
      )}
      {isCorrectAnswer && !isUserAnswer && (
        <span className="text-xs px-2 py-0.5 rounded bg-(--color-positive-200) text-(--color-positive-800)">
          正解
        </span>
      )}
    </div>
  )
}
