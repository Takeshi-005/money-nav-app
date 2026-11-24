"use client";

import { useMemo } from "react";
import { useAuth } from "@/entities/session";
import { useDashboardData } from "@/features/dashboard-data";
import {
  useRoadmapProgress,
  type RoadmapPracticeSignals,
} from "@/features/roadmap-progress";
import { RoadmapStepper } from "@/widgets/roadmap-stepper";
import { Typography } from "@/shared/ui/typography";

export function RoadmapPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardData();

  // ログイン時のみ、サーバー由来のシグナルをフックに渡す（ゲストは null）
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

  const { progress, reportAccountOpened, reportFirstPurchase } =
    useRoadmapProgress(loggedInSignals);

  return (
    <div className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-surface-secondary px-6 py-8 shadow-sm sm:px-8">
      <Typography variant="title_L" as="h1" className="mb-2 text-foreground">
        あなたの投資ロードマップ
      </Typography>
      <Typography variant="M" className="mb-6 text-(--text-secondary)">
        最初の一歩から「続ける」まで。今いる場所と、次の一歩がわかります。
      </Typography>

      {user && isLoading ? (
        <Typography variant="M" className="text-(--text-secondary)">
          読み込み中…
        </Typography>
      ) : (
        <RoadmapStepper
          progress={progress}
          onReportAccountOpened={reportAccountOpened}
          onReportFirstPurchase={reportFirstPurchase}
        />
      )}
    </div>
  );
}
