/**
 * Quiz Daily History Widget - DailyHistoryAccordion
 * 日別履歴アコーディオン
 */

import { cn } from "@/shared/lib/utils"
import type { DailyHistory } from "@/entities/quiz"
import { formatDateJapanese } from "@/entities/quiz"
import { QuizDetailCard } from "./QuizDetailCard"

export interface DailyHistoryAccordionProps {
  day: DailyHistory
  isExpanded: boolean
  onToggle: () => void
}

export function DailyHistoryAccordion({
  day,
  isExpanded,
  onToggle,
}: DailyHistoryAccordionProps) {
  return (
    <div className="rounded-3xl overflow-hidden bg-surface-secondary border border-(--border-primary) shadow-md">
      {/* 日付ヘッダー */}
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between transition-all hover:bg-opacity-80 bg-transparent"
      >
        <div className="flex items-center gap-4">
          <span className="font-bold text-foreground">
            {formatDateJapanese(day.date)}
          </span>
          <div className="flex gap-1">
            {day.quizzes.map((quiz, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-6 h-6 rounded flex items-center justify-center",
                  quiz.isCorrect && "bg-(--color-positive-100)",
                  !quiz.isCorrect && "bg-(--color-negative-100)"
                )}
              >
                {quiz.isCorrect ? (
                  <svg
                    className="w-3.5 h-3.5 text-(--color-positive-600)"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 h-3.5 text-(--color-negative-600)"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-lg font-mono font-bold",
              day.correctCount === day.totalQuizzes && "text-(--color-positive-600)",
              day.correctCount !== day.totalQuizzes && "text-(--text-secondary)"
            )}
          >
            {day.correctCount}/{day.totalQuizzes}
          </span>
          <svg
            className={cn(
              "w-5 h-5 transition-transform duration-200 text-(--text-tertiary)",
              isExpanded && "rotate-180"
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* 詳細展開部分 */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-(--border-primary)">
          {day.quizzes.map((quiz, idx) => (
            <QuizDetailCard key={idx} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  )
}
