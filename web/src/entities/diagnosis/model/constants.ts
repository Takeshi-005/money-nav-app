/**
 * Diagnosis Entity - Constants
 * 診断フローの定数定義
 */

/** 診断ステップ（1-9の9ステップ） */
export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/** 総ステップ数 */
export const TOTAL_STEPS = 9

/** ステップごとのフィールドマッピング */
export const stepToAnswerKey: Record<Step, keyof import("@/types/supabase").DiagnosisInput> = {
  1: "region",
  2: "period",
  3: "style",
  4: "riskTolerance",
  5: "budget",
  6: "purpose",
  7: "lossReaction",
  8: "decisionBasis",
  9: "volatilityResponse",
}
