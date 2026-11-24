"use client"

/**
 * Quiz Stats Grid Component
 * 統計サマリーグリッド
 */
import type { QuizStats } from "@/entities/quiz"
import { cn } from "@/shared/lib/utils"

export interface QuizStatsGridProps {
  stats: QuizStats
}

export function QuizStatsGrid({ stats }: QuizStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <StatItem value={stats.totalAttempts} label="総回答数" colorClass="text-foreground" />
      <StatItem value={`${stats.accuracy}%`} label="正解率" colorClass="text-positive-600" />
      <StatItem value={stats.streakDays} label="連続日数" colorClass="text-accent-600" />
      <StatItem value={stats.perfectDays} label="全問正解" colorClass="text-brand-600" />
    </div>
  )
}

interface StatItemProps {
  value: number | string
  label: string
  colorClass: string
}

function StatItem({ value, label, colorClass }: StatItemProps) {
  return (
    <div className="p-4 rounded-xl text-center bg-surface-tertiary">
      <div className={cn("text-2xl font-bold font-mono", colorClass)}>
        {value}
      </div>
      <div className="text-xs mt-1 text-(--text-tertiary)">
        {label}
      </div>
    </div>
  )
}
