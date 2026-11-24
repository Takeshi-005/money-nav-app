"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/widgets/header";
import { SiteFooter } from "@/widgets/site-footer";
import { useQuizHistoryData } from "@/features/quiz-history-data";
import { QuizHistoryHeader } from "@/widgets/quiz-history-header";
import { QuizStatsSummary } from "@/widgets/quiz-stats-summary";
import { QuizDailyHistory } from "@/widgets/quiz-daily-history";
import { QuizEmptyState } from "@/widgets/quiz-empty-state";
import { QuizHistorySkeleton } from "./QuizHistorySkeleton";
import { QuizHistoryError } from "./QuizHistoryError";

export function QuizHistoryPage() {
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date");

  const { stats, history, isLoading, error, refetch } = useQuizHistoryData();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  if (isLoading) {
    return <QuizHistorySkeleton />;
  }

  if (error) {
    return <QuizHistoryError onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 space-y-6 w-full">
        <QuizHistoryHeader />

        {/* 統計サマリー */}
        {stats && stats.totalAttempts > 0 && <QuizStatsSummary stats={stats} />}

        {/* 履歴一覧 */}
        {history.length > 0 ? (
          <QuizDailyHistory
            key={selectedDate ?? "no-selection"}
            history={history}
            expandedDate={expandedDate ?? selectedDate}
            onExpandedChange={setExpandedDate}
          />
        ) : (
          <QuizEmptyState />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
