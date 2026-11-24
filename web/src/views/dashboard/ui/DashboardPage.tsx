"use client";

import { useMemo } from "react";
import { useAuth } from "@/entities/session";
import { useDashboardData } from "@/features/dashboard-data";
import {
  useRoadmapProgress,
  type RoadmapPracticeSignals,
} from "@/features/roadmap-progress";
import { useNewsArticle } from "@/features/news-article-data";
import { UserProfileCard } from "@/widgets/user-profile-card";
import { RoadmapSummaryCard } from "@/widgets/roadmap-summary";
import { TodayQuizCard } from "@/widgets/today-quiz-card";
import { QuizHistoryCard } from "@/widgets/quiz-history-card";
import { DiagnosisCTA } from "@/widgets/diagnosis-cta";
import { DiagnosisResultCard } from "@/widgets/diagnosis-result-card";
import { LatestNewsArticleCard } from "@/widgets/latest-news-article";
import { Typography } from "@/shared/ui/typography";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { DashboardError } from "./DashboardError";

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useDashboardData();
  const { data: latestArticle } = useNewsArticle();

  // ロードマップ要約（早期returnより前にフックを呼ぶ）
  const loggedInSignals: RoadmapPracticeSignals | null = useMemo(() => {
    if (!user) {
      return null;
    }
    return {
      hasDiagnosis: data?.diagnosis != null,
      quizStreakDays: data?.quizStats?.streakDays ?? 0,
      quizTotalAttempts: data?.quizStats?.totalAttempts ?? 0,
    };
  }, [user, data]);
  const { progress: roadmapProgress } = useRoadmapProgress(loggedInSignals);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError onRetry={refetch} />;
  }

  const { userData, quizSummary, diagnosis, quizStats, quizHistory } = data;

  return (
    <div className="max-w-6xl mx-auto my-8 px-6 sm:px-8 py-8 space-y-6 w-full bg-surface-secondary rounded-2xl shadow-sm">
      <Typography variant="title_L" className="text-3xl mb-6 text-foreground">
        マイページ - 投資学習の進捗
      </Typography>

      {/* 投資ロードマップ要約 */}
      <section>
        <h2 className="sr-only">投資ロードマップ</h2>
        <RoadmapSummaryCard progress={roadmapProgress} />
      </section>

      {/* ユーザー情報カード */}
      <section>
        <h2 className="sr-only">ユーザープロフィール</h2>
        <UserProfileCard user={user} userData={userData} />
      </section>

      {/* メインコンテンツ: 2カラム */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左カラム: クイズ */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="sr-only">今日のクイズ</h2>
            <TodayQuizCard quizSummary={quizSummary} />
          </section>
          <section>
            <h2 className="sr-only">クイズ履歴</h2>
            <QuizHistoryCard stats={quizStats} history={quizHistory} />
          </section>
        </div>

        {/* 右カラム: ニュース解説・診断結果 */}
        <div className="space-y-6">
          <section>
            <h2 className="sr-only">今日のニュース解説</h2>
            <LatestNewsArticleCard article={latestArticle ?? null} />
          </section>
          <section>
            <h2 className="sr-only">投資スタイル診断</h2>
            {diagnosis ? (
              <DiagnosisResultCard diagnosis={diagnosis} />
            ) : (
              <DiagnosisCTA />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
