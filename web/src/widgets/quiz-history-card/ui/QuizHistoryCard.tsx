"use client"

/**
 * Quiz History Card Widget
 * 学習履歴セクション
 */
import Link from "next/link"
import { QuizResultBadge, formatDate } from "@/entities/quiz"
import type { QuizStats, DailyHistory } from "@/entities/quiz"
import { QuizStatsGrid } from "./QuizStatsGrid"
import { cn } from "@/shared/lib/utils"

export interface QuizHistoryCardProps {
  stats: QuizStats | null
  history: DailyHistory[]
}

export function QuizHistoryCard({ stats, history }: QuizHistoryCardProps) {
  // 履歴がなければ表示しない
  if (!stats || stats.totalAttempts === 0) {
    return null
  }

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-surface-secondary border border-(--border-primary) shadow-md">

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-100">

            <svg
              className="w-5 h-5 text-(--color-accent-600)"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            学習履歴
          </h2>
        </div>
        <Link
          href="/quiz/history"
          className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all text-brand"
        >
          もっと見る
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

      {/* 統計サマリー */}
      <QuizStatsGrid stats={stats} />

      {/* 直近の履歴 */}
      <div className="space-y-2">
        {history.map((day) => (
          <HistoryItem key={day.date} history={day} />
        ))}
      </div>
    </div>
  )
}

interface HistoryItemProps {
  history: DailyHistory
}

function HistoryItem({ history }: HistoryItemProps) {
  const isPerfect = history.correctCount === history.totalQuizzes

  return (
    <Link
      href={`/quiz/history?date=${history.date}`}
      className="flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:scale-[1.01] bg-surface-tertiary"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-(--text-secondary)">
          {formatDate(history.date)}
        </span>
        <div className="flex gap-1">
          {history.quizzes.map((quiz, idx) => (
            <QuizResultBadge key={idx} isCorrect={quiz.isCorrect} size="sm" />
          ))}
        </div>
      </div>
      <span
        className={cn(
          "text-sm font-mono",
          isPerfect ? "text-positive-600" : "text-(--text-secondary)"
        )}
      >
        {history.correctCount}/{history.totalQuizzes}
      </span>
    </Link>
  )
}
