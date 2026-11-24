"use client";

/**
 * Today Quiz Card Widget
 * 今日のクイズセクション
 */
import Link from "next/link";
import { QuizTypeIconsGroup } from "@/entities/quiz";
import type { QuizSummary } from "@/entities/quiz";
import { cn } from "@/shared/lib/utils";
import { IconContainer } from "@/shared/ui/icon-container";
import { Typography } from "@/shared/ui/typography";

export interface TodayQuizCardProps {
  quizSummary: QuizSummary | null;
}

export function TodayQuizCard({ quizSummary }: TodayQuizCardProps) {
  return (
    <div className="p-6 md:p-8 rounded-3xl bg-surface-secondary border-(--border-primary) shadow-md">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <IconContainer size="md" rounded="md" bgColor="brand">
          <svg
            className="w-5 h-5 text-brand-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
        </IconContainer>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            今日のクイズ
          </h2>
          <div className="flex items-center gap-1.5 text-xs mt-1 text-(--text-tertiary)">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>毎日 9:00 更新</span>
          </div>
        </div>
      </div>

      {quizSummary && quizSummary.totalQuizzes > 0 ? (
        <QuizContent quizSummary={quizSummary} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function QuizContent({ quizSummary }: { quizSummary: QuizSummary }) {
  const isCompleted = quizSummary.answeredCount === quizSummary.totalQuizzes;
  const progress = (quizSummary.answeredCount / quizSummary.totalQuizzes) * 100;

  return (
    <div>
      {/* 進捗表示 */}
      <div className="flex items-center gap-4 mb-6">
        <QuizTypeIconsGroup size="md" />
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-(--text-secondary)">
              進捗
            </span>
            <span className="text-sm font-mono text-(--text-tertiary)">
              {quizSummary.answeredCount}/{quizSummary.totalQuizzes} 問回答済み
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-surface-tertiary">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                isCompleted
                  ? "bg-positive-500"
                  : "bg-gradient-brand-horizontal",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* スコア表示（回答済みの場合） */}
      {quizSummary.answeredCount > 0 && (
        <div className="p-5 rounded-2xl mb-6 bg-surface-tertiary">
          <div className="flex items-center justify-between">
            <span className="font-medium text-(--text-secondary)">正解数</span>
            <span
              className={cn(
                "font-bold text-lg font-mono",
                quizSummary.correctCount === quizSummary.totalQuizzes
                  ? "text-positive-600"
                  : "text-foreground",
              )}
            >
              {quizSummary.correctCount}/{quizSummary.totalQuizzes}
            </span>
          </div>
          {quizSummary.allCorrectBonus > 0 && (
            <div className="mt-3 text-sm font-bold text-center py-2 rounded-xl bg-accent-100 text-accent-700">
              全問正解ボーナス +{quizSummary.allCorrectBonus} EXP
            </div>
          )}
        </div>
      )}

      {/* クイズへのリンク */}
      <Link
        href="/quiz"
        className={cn(
          "flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.01]",
          isCompleted
            ? "bg-surface-tertiary text-(--text-secondary)"
            : "bg-gradient-brand  shadow-glow-brand",
        )}
      >
        {isCompleted
          ? "結果を確認する"
          : quizSummary.answeredCount > 0
            ? "続きを解く"
            : "クイズに挑戦する"}
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <IconContainer
        size="2xl"
        rounded="lg"
        bgColor="surface"
        className="mx-auto mb-4"
      >
        <svg
          className="w-8 h-8 text-(--text-tertiary)"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </IconContainer>
      <Typography variant="M_bold" color="gray">
        今日のクイズはまだありません
      </Typography>
      <Typography variant="S" color="muted" className="mt-2">
        毎日新しいクイズが届きます
      </Typography>
    </div>
  );
}
