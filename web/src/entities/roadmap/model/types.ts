/**
 * Roadmap Entity - Type Definitions
 * 投資初心者の「最初の一歩」を一本道で可視化するための型。
 */

/** ロードマップの各ステージ識別子（order 昇順） */
export type RoadmapStageId =
  | "interest"
  | "diagnosis"
  | "practice"
  | "account"
  | "firstPurchase"
  | "continue";

/** ステージの表示状態 */
export type RoadmapStageStatus = "completed" | "current" | "upcoming";

/** ステージの静的な定義（コピー・順序） */
export interface RoadmapStageDefinition {
  id: RoadmapStageId;
  /** 1 始まりの並び順 */
  order: number;
  label: string;
  /** この段階の初心者が抱える不安（寄り添うコピー） */
  anxiety: string;
  /** 次の一歩を促すナッジ */
  nudge: string;
  /** 完了時の祝いメッセージ */
  celebrate: string;
  /** 収益導線(#20)を差し込むスロットを持つ段階か */
  hasReferralSlot: boolean;
}

/**
 * ステージ判定の入力シグナル。
 * 既存データ（診断有無・クイズ統計・予測成績）＋自己申告フラグから合成する。
 */
export interface RoadmapSignals {
  hasDiagnosis: boolean;
  quizStreakDays: number;
  quizTotalAttempts: number;
  /** 0〜1。未プレイなら null */
  predictionWinRate: number | null;
  predictionTotal: number;
  /** ISO 文字列。未申告なら null */
  accountOpenedAt: string | null;
  /** ISO 文字列。未申告なら null */
  firstPurchaseAt: string | null;
}

/** 定義＋現在の状態を持つ表示用ステージ */
export interface RoadmapStageView extends RoadmapStageDefinition {
  status: RoadmapStageStatus;
}

/** computeRoadmapStage の戻り値 */
export interface RoadmapProgress {
  stages: RoadmapStageView[];
  currentStageId: RoadmapStageId;
  /** いま取り組むべき一歩（現在ステージの nudge） */
  nextStep: string;
  completedCount: number;
}
