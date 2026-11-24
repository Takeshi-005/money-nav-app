/**
 * Quiz Daily History Widget
 * 日別履歴一覧コンテナ
 */
"use client"

import type { DailyHistory } from "@/entities/quiz"
import { DailyHistoryAccordion } from "./DailyHistoryAccordion"

export interface QuizDailyHistoryProps {
  history: DailyHistory[]
  expandedDate: string | null
  onExpandedChange: (date: string | null) => void
}

export function QuizDailyHistory({
  history,
  expandedDate,
  onExpandedChange,
}: QuizDailyHistoryProps) {
  const handleToggle = (date: string) => {
    onExpandedChange(expandedDate === date ? null : date)
  }

  return (
    <div className="space-y-4">
      {history.map((day) => (
        <DailyHistoryAccordion
          key={day.date}
          day={day}
          isExpanded={expandedDate === day.date}
          onToggle={() => handleToggle(day.date)}
        />
      ))}
    </div>
  )
}
