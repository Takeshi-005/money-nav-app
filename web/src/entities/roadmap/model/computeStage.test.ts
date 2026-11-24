import { describe, it, expect } from "vitest";
import { computeRoadmapStage, hasGraduatedPractice } from "./computeStage";
import type { RoadmapSignals } from "./types";

function makeSignals(overrides: Partial<RoadmapSignals> = {}): RoadmapSignals {
  return {
    hasDiagnosis: false,
    quizStreakDays: 0,
    quizTotalAttempts: 0,
    predictionWinRate: null,
    predictionTotal: 0,
    accountOpenedAt: null,
    firstPurchaseAt: null,
    ...overrides,
  };
}

describe("computeRoadmapStage", () => {
  it("新規ユーザーは interest 完了・diagnosis が現在地", () => {
    const result = computeRoadmapStage(makeSignals());
    expect(result.currentStageId).toBe("diagnosis");
    expect(result.completedCount).toBe(1);
    expect(result.stages[0].status).toBe("completed");
    expect(result.stages[1].status).toBe("current");
  });

  it("診断のみ完了なら practice が現在地", () => {
    const result = computeRoadmapStage(makeSignals({ hasDiagnosis: true }));
    expect(result.currentStageId).toBe("practice");
  });

  it("クイズ連続で練習を卒業したら account が現在地", () => {
    const result = computeRoadmapStage(
      makeSignals({ hasDiagnosis: true, quizStreakDays: 3 }),
    );
    expect(result.currentStageId).toBe("account");
  });

  it("予測のサンプル＆勝率でも練習を卒業できる", () => {
    const result = computeRoadmapStage(
      makeSignals({
        hasDiagnosis: true,
        predictionTotal: 5,
        predictionWinRate: 0.6,
      }),
    );
    expect(result.currentStageId).toBe("account");
  });

  it("勝率が閾値未満なら練習は卒業しない", () => {
    const result = computeRoadmapStage(
      makeSignals({
        hasDiagnosis: true,
        quizTotalAttempts: 2,
        predictionTotal: 5,
        predictionWinRate: 0.2,
      }),
    );
    expect(result.currentStageId).toBe("practice");
  });

  it("口座開設の申告があれば、練習が未卒業でも account までは完了扱い（単調）", () => {
    const result = computeRoadmapStage(
      makeSignals({ accountOpenedAt: "2026-06-28T00:00:00Z" }),
    );
    expect(result.currentStageId).toBe("firstPurchase");
    const account = result.stages.find((s) => s.id === "account");
    const practice = result.stages.find((s) => s.id === "practice");
    expect(account?.status).toBe("completed");
    expect(practice?.status).toBe("completed");
  });

  it("初購入の申告があれば continue が現在地（継続は常に進行中）", () => {
    const result = computeRoadmapStage(
      makeSignals({
        accountOpenedAt: "2026-06-28T00:00:00Z",
        firstPurchaseAt: "2026-06-28T01:00:00Z",
      }),
    );
    expect(result.currentStageId).toBe("continue");
    expect(result.completedCount).toBe(5);
  });
});

describe("hasGraduatedPractice", () => {
  it("クイズ連続日数の閾値で卒業", () => {
    expect(hasGraduatedPractice(makeSignals({ quizStreakDays: 3 }))).toBe(true);
    expect(hasGraduatedPractice(makeSignals({ quizStreakDays: 2 }))).toBe(false);
  });
});
