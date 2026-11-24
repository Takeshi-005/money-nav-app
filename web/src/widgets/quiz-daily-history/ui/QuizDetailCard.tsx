/**
 * Quiz Daily History Widget - QuizDetailCard
 * クイズ詳細カード
 */

import type { QuizHistoryItem } from "@/entities/quiz"
import {
  QuizTypeBadge,
  CorrectnessBadge,
  OptionItem,
  ExplanationBox,
} from "@/entities/quiz"

export interface QuizDetailCardProps {
  quiz: QuizHistoryItem
}

export function QuizDetailCard({ quiz }: QuizDetailCardProps) {
  return (
    <div className="p-4 rounded-2xl mt-4 bg-surface-tertiary">
      {/* クイズタイプバッジ */}
      <div className="flex items-center gap-2 mb-3">
        <QuizTypeBadge quizType={quiz.quizType} />
        <CorrectnessBadge isCorrect={quiz.isCorrect} />
      </div>

      {/* 問題文 */}
      {quiz.question && (
        <p className="font-medium mb-4 text-foreground">
          {quiz.question}
        </p>
      )}

      {/* 選択肢 */}
      {quiz.options && (
        <div className="space-y-2 mb-4">
          {quiz.options.map((option) => (
            <OptionItem
              key={option.id}
              option={option}
              isUserAnswer={option.id === quiz.selectedOptionId}
              isCorrectAnswer={option.id === quiz.correctOptionId}
              userAnswerCorrect={quiz.isCorrect}
            />
          ))}
        </div>
      )}

      {/* 解説 */}
      {quiz.explanation && <ExplanationBox explanation={quiz.explanation} />}
    </div>
  )
}
