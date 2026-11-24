/**
 * Quiz Card Widget
 * クイズカード（質問・選択肢・回答・解説）
 */

import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import {
  type SingleQuizData,
  type QuizAttempt,
  QuestionIcon,
  CorrectIcon,
  IncorrectIcon,
  LightbulbIcon,
} from "@/entities/quiz";
import { Typography } from "@/shared/ui/typography";

export interface QuizCardProps {
  quiz: SingleQuizData;
  attempt?: QuizAttempt;
  selectedOption: number | null;
  isSubmitting: boolean;
  onSelectOption: (optionId: number) => void;
  onSubmit: () => void;
  onNext?: () => void;
  explanationNode?: ReactNode;
}

export function QuizCard({
  quiz,
  attempt,
  selectedOption,
  isSubmitting,
  onSelectOption,
  onSubmit,
  onNext,
  explanationNode,
}: QuizCardProps) {
  return (
    <div className="rounded-3xl overflow-hidden bg-surface-secondary border border-(--border-primary)">
      <div className="p-6 bg-linear-to-br from-brand-600 to-brand-700">
        <h2 className="mb-1">
          <Typography variant="L_bold">{quiz.title}</Typography>
          <Typography variant="S_bold">
            正解して経験値をゲットしよう！
          </Typography>
        </h2>
      </div>

      {/* Question Area */}
      <div className="p-6">
        {/* 質問 */}
        <div className="p-5 rounded-2xl mb-6 bg-surface-tertiary">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-brand-100 text-brand-600">
              <QuestionIcon />
            </div>
            <Typography variant="M_bold" className="leading-relaxed pt-1">
              {quiz.question}
            </Typography>
          </div>
        </div>

        {/* 選択肢 */}
        <div className="space-y-3">
          {quiz.options.map((option) => {
            const isSelected = attempt?.answered
              ? attempt.selectedOptionId === option.id
              : selectedOption === option.id;
            const isCorrect =
              attempt?.answered && option.id === quiz.correct_option_id;
            const isWrong =
              attempt?.answered &&
              isSelected &&
              option.id !== quiz.correct_option_id;

            return (
              <button
                key={option.id}
                onClick={() => !attempt?.answered && onSelectOption(option.id)}
                disabled={attempt?.answered}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 border-2 text-foreground",
                  !attempt?.answered &&
                    !isSelected &&
                    "bg-surface-tertiary border-(--border-primary)",
                  !attempt?.answered &&
                    isSelected &&
                    "bg-surface-elevated border-brand-400",
                  attempt?.answered &&
                    isCorrect &&
                    "bg-positive-400 border-(--color-positive)",
                  attempt?.answered &&
                    isWrong &&
                    "bg-negative-400 border-(--color-negative)",
                  attempt?.answered &&
                    !isCorrect &&
                    !isWrong &&
                    "bg-surface-tertiary border-(--border-primary)",
                )}
              >
                <span
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    !isCorrect &&
                      !isWrong &&
                      !isSelected &&
                      "bg-surface-secondary text-(--text-secondary)",
                    !attempt?.answered && isSelected && "bg-brand-500 ",
                    isCorrect && "bg-(--color-positive) ",
                    isWrong && "bg-(--color-negative) ",
                  )}
                >
                  {option.id}
                </span>
                <span className="flex-1">{option.text}</span>
                {isCorrect && (
                  <span className="text-(--color-positive)">
                    <CorrectIcon />
                  </span>
                )}
                {isWrong && (
                  <span className="text-(--color-negative)">
                    <IncorrectIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Submit Button or Result */}
        {!attempt?.answered ? (
          <button
            onClick={onSubmit}
            disabled={selectedOption === null || isSubmitting}
            className={cn(
              "w-full mt-6 py-4 rounded-2xl font-bold text-lg transition-all duration-200 disabled:opacity-50 hover:scale-[1.02]",
              selectedOption !== null && "bg-gradient-brand ",
              selectedOption === null &&
                "bg-surface-tertiary text-(--text-tertiary)",
            )}
          >
            {isSubmitting ? "送信中..." : "回答する"}
          </button>
        ) : (
          <div className="mt-6 space-y-4">
            {/* Result Display */}
            <div
              className={cn(
                "p-6 rounded-2xl text-center",
                attempt.isCorrect && "bg-(--color-positive-bg)",
                !attempt.isCorrect && "bg-(--color-negative-bg)",
              )}
            >
              <Typography
                variant="title_SS"
                className={cn(
                  "font-bold",
                  attempt.isCorrect && "text-(--color-positive)",
                  !attempt.isCorrect && "text-(--color-negative)",
                )}
              >
                {attempt.isCorrect ? "正解！" : "不正解..."}
              </Typography>
              {attempt.isCorrect && attempt.gainedExp && (
                <Typography
                  variant="S_bold"
                  className="mt-1 text-(--color-positive)"
                >
                  +{attempt.gainedExp} EXP
                </Typography>
              )}
            </div>

            {/* Explanation */}
            {quiz.explanation && (
              <div className="p-5 rounded-2xl bg-surface-tertiary">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-(--color-accent-500)">
                    <LightbulbIcon />
                  </span>
                  <h4 className="font-bold text-foreground">解説</h4>
                </div>
                <Typography
                  variant="S"
                  className="leading-relaxed text-brand-950"
                >
                  {explanationNode ?? quiz.explanation}
                </Typography>
              </div>
            )}

            {/* Next Question Button */}
            {onNext && (
              <button
                onClick={onNext}
                className="w-full py-4 rounded-2xl font-bold transition-all duration-200 hover:scale-[1.02] bg-linear-to-br from-brand-500 to-brand-600 "
              >
                次の問題へ →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
