// Supabase Database型定義
// 自動生成: pnpm gen:types

// 自動生成された型をre-export
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./database.types";
export { Constants } from "./database.types";

import type { Database } from "./database.types";

// ============================================
// カスタム型定義（アプリケーション固有）
// ============================================

// 投資家タイプコード（8タイプ）
export type InvestorTypeCode =
  | "BUFFETT" // バフェット型（価値の賢者）
  | "LYNCH" // リンチ型（成長の探求者）
  | "SOROS" // ソロス型（相場の読み師）
  | "GRAHAM" // グレアム型（堅実な分析家）
  | "ONEILL" // オニール型（モメンタム追従者）
  | "TEMPLETON" // テンプルトン型（逆張りの勇者）
  | "BOGLE" // ボーグル型（インデックス信者）
  | "DALIO"; // ダリオ型（全天候型戦略家）

// Gemini APIからの診断結果（inputData含まない）
export interface DiagnosisAIResult {
  // タイプ識別
  typeCode: InvestorTypeCode;
  investorType: string;

  // 説明
  resultText: string;
  famousQuote: string;

  // 強み・弱み
  strengths: string[];
  weaknesses: string[];

  // 行動アドバイス
  actionAdvice: string;

  // 推奨情報
  recommendedSectors: string[];
  suggestedTickers: {
    code: string;
    name: string;
    reason: string;
  }[];
}

// 保存される診断結果のJSON構造（inputData含む）
export interface DiagnosisResult extends DiagnosisAIResult {
  inputData: DiagnosisInput;
}

// 診断入力
export interface DiagnosisInput {
  // 投資条件（既存）
  region: "japan" | "us";
  period: "short" | "medium" | "long";
  style: "growth" | "dividend";
  riskTolerance: "low" | "medium" | "high";
  budget: "1" | "3" | "10";
  purpose: "retirement" | "income" | "hobby" | "fire";

  // 心理・行動傾向（新規追加）
  lossReaction: "sell" | "hold" | "buy_more";
  decisionBasis: "news" | "chart" | "financials" | "intuition";
  volatilityResponse: "immediate" | "analyze" | "ignore";
}

// ============================================
// クイズ関連の型定義
// ============================================

// クイズタイプ（5種類）
export type QuizType = "news" | "scenario" | "psychology" | "history" | "basic";

// 難易度レベル（3段階）
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

// クイズの選択肢
export interface QuizOption {
  id: number;
  text: string;
}

// 個別クイズの構造（新形式: 3問対応）
export interface SingleQuiz {
  quiz_type: QuizType;
  title: string;
  question: string;
  options: QuizOption[];
  correct_option_id: number;
  explanation: string;
  sub_theme?: string;
}

// 3問セットのクイズコンテンツ（新形式）
export interface DailyQuizContent {
  quizzes: SingleQuiz[];
}

// 旧形式のクイズコンテンツ（下位互換用）
export interface QuizContentLegacy {
  newsTitle: string;
  newsSummary: string;
  quizQuestion: string;
  options: QuizOption[];
  correctOptionId: number;
  explanation: string;
}

// 共通型（旧形式との互換）
export type QuizContent = QuizContentLegacy;

// 回答状態の型
export interface QuizAttemptStatus {
  answered: boolean;
  isCorrect?: boolean;
  selectedOptionId?: number;
  gainedExp?: number;
}

// 3問の回答状態をまとめた型
export type QuizAttemptsMap = Record<QuizType, QuizAttemptStatus>;

// ============================================
// 読み物コンテンツ関連の型定義
// ============================================

// 投資家ガイドのコンテンツ構造
export interface InvestorGuideContent {
  overview: string;
  philosophy: string;
  keyPrinciples: string[];
  learningSteps: {
    step: number;
    title: string;
    description: string;
    duration: string;
  }[];
  recommendedBooks: {
    title: string;
    author: string;
    reason: string;
  }[];
  commonMistakes: string[];
  checklistForBeginner: string[];
}

// 市場影響分析
export interface MarketImpactEntry {
  direction: "positive" | "negative" | "neutral";
  magnitude: "large" | "medium" | "small";
  summary: string;
  reason: string;
}

export interface AffectedSector {
  name: string;
  impact: "positive" | "negative" | "neutral";
  reason: string;
}

export interface MarketImpact {
  nikkeiImpact: MarketImpactEntry;
  topixImpact: MarketImpactEntry;
  affectedSectors: AffectedSector[];
  educationalNote: string;
}

// ニュース解説記事のコンテンツ構造
export interface NewsArticleContent {
  title: string;
  summary: string;
  theme: string;
  category?: string;
  sections: {
    heading: string;
    body: string;
    keyTerms: {
      term: string;
      slug?: string | null;
      definition: string;
    }[];
  }[];
  investorInsight: string;
  relatedTopics: string[];
  actionItems?: string[];
  xPostBody?: string;
  marketImpact?: MarketImpact;
}

// ============================================
// 予測トレーニング関連の型定義
// ============================================

export type PredictionDirection = "up" | "down";

export interface UserPerformance {
  totalPredictions: number;
  correctPredictions: number;
  winRate: number;
  totalPnl: number;
  currentStreak: number;
  maxStreak: number;
}

// ============================================
// 便利な型エイリアス
// ============================================

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Diagnostic = Database["public"]["Tables"]["diagnostics"]["Row"];
export type DailyQuiz = Database["public"]["Tables"]["daily_quizzes"]["Row"];
export type QuizAttempt = Database["public"]["Tables"]["quiz_attempts"]["Row"];
export type NewsArticleRow =
  Database["public"]["Tables"]["news_articles"]["Row"];
export type PredictionResultRow =
  Database["public"]["Tables"]["prediction_results"]["Row"];
export type PredictionRow =
  Database["public"]["Tables"]["predictions"]["Row"];
export type UserPerformanceRow =
  Database["public"]["Tables"]["user_performance"]["Row"];

// Insert型
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type DiagnosticInsert =
  Database["public"]["Tables"]["diagnostics"]["Insert"];
export type DailyQuizInsert =
  Database["public"]["Tables"]["daily_quizzes"]["Insert"];
export type QuizAttemptInsert =
  Database["public"]["Tables"]["quiz_attempts"]["Insert"];
export type PredictionResultInsert =
  Database["public"]["Tables"]["prediction_results"]["Insert"];
export type PredictionInsert =
  Database["public"]["Tables"]["predictions"]["Insert"];
