/**
 * Quiz Stats Summary Widget
 * 統計サマリーカード
 */

import type { QuizStats } from "@/entities/quiz"
import { StatItem } from "./StatItem"

export interface QuizStatsSummaryProps {
  stats: QuizStats
}

export function QuizStatsSummary({ stats }: QuizStatsSummaryProps) {
  return (
    <div
      className="p-6 rounded-3xl bg-surface-secondary border border-(--border-primary) shadow-md"
    >
      <h2
        className="text-lg font-bold mb-4 text-foreground"
      >
        成績サマリー
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatItem value={stats.totalAttempts} label="総回答数" />
        <StatItem
          value={stats.correctCount}
          label="正解数"
          colorClass="text-positive-600"
        />
        <StatItem
          value={stats.accuracy}
          label="正解率"
          colorClass="text-positive-600"
        />
        <StatItem
          value={stats.streakDays}
          label="連続日数"
          colorClass="text-accent-600"
        />
        <StatItem
          value={stats.perfectDays}
          label="全問正解日数"
          colorClass="text-brand-600"
        />
      </div>
    </div>
  )
}
