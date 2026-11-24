import type { PredictionDirection, UserPerformance } from "@/types/supabase";

export type { PredictionDirection, UserPerformance };

export interface TodayPredictionData {
  date: string;
  question: string;
  contextSummary: string;
  isRevealed: boolean;
  userPrediction?: PredictionDirection;
}

export interface YesterdayResultData {
  date: string;
  actualMovement: PredictionDirection;
  explanation: string | null;
  userPrediction?: PredictionDirection;
  isCorrect?: boolean;
}

export interface PredictionPageData {
  today: TodayPredictionData | null;
  yesterday: YesterdayResultData | null;
  performance: UserPerformance;
  isGuest: boolean;
}

export interface PredictionHistoryItem {
  date: string;
  prediction: PredictionDirection;
  actualMovement?: PredictionDirection;
  isCorrect?: boolean;
}
