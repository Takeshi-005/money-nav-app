import { ROADMAP_STAGES, PRACTICE_GRADUATION } from "./stages";
import type {
  RoadmapProgress,
  RoadmapSignals,
  RoadmapStageView,
} from "./types";

/**
 * 練習ステージを「卒業」したか＝口座開設を勧めてよい状態か。
 * クイズの継続、または予測の十分なサンプル＆勝率のいずれかで判定。
 * 閾値は {@link PRACTICE_GRADUATION} で調整する。
 */
export function hasGraduatedPractice(signals: RoadmapSignals): boolean {
  const enoughQuiz =
    signals.quizStreakDays >= PRACTICE_GRADUATION.minQuizStreakDays;
  const enoughPrediction =
    signals.predictionTotal >= PRACTICE_GRADUATION.minPredictionSamples &&
    (signals.predictionWinRate ?? 0) >= PRACTICE_GRADUATION.minPredictionWinRate;
  return enoughQuiz || enoughPrediction;
}

/**
 * 到達済みの最終ステージの order を求める。
 * 「下流の達成は上流の達成を含意する」ため、order の最大値を取れば
 * 自然に単調（途中が虫食いにならない）になる。
 */
function resolveFurthestCompletedOrder(signals: RoadmapSignals): number {
  let order = 1; // interest: サイト訪問時点で完了とみなす
  if (signals.hasDiagnosis) {
    order = Math.max(order, 2);
  }
  if (hasGraduatedPractice(signals)) {
    order = Math.max(order, 3);
  }
  if (signals.accountOpenedAt) {
    order = Math.max(order, 4);
  }
  if (signals.firstPurchaseAt) {
    order = Math.max(order, 5);
  }
  return order;
}

/**
 * シグナルから一本道ジャーニーの現在地を算出する純粋関数。
 * UI はこの結果（各ステージの status と nextStep）を描くだけにする。
 */
export function computeRoadmapStage(signals: RoadmapSignals): RoadmapProgress {
  const furthest = resolveFurthestCompletedOrder(signals);

  const stages: RoadmapStageView[] = ROADMAP_STAGES.map((stage) => {
    if (stage.order <= furthest) {
      return { ...stage, status: "completed" };
    }
    if (stage.order === furthest + 1) {
      return { ...stage, status: "current" };
    }
    return { ...stage, status: "upcoming" };
  });

  // continue(最終)は常に「進行中」なので、furthest=5 のとき current になる
  const current =
    stages.find((stage) => stage.status === "current") ??
    stages[stages.length - 1];

  return {
    stages,
    currentStageId: current.id,
    nextStep: current.nudge,
    completedCount: stages.filter((stage) => stage.status === "completed")
      .length,
  };
}
