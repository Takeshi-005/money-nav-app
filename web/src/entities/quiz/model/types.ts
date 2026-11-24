/**
 * Quiz Entity - Type Definitions
 * クイズ関連の型定義
 */

/** 今日のクイズサマリー */
export interface QuizSummary {
  totalQuizzes: number
  answeredCount: number
  correctCount: number
  allCorrectBonus: number
}

/** クイズ統計情報 */
export interface QuizStats {
  totalAttempts: number
  correctCount: number
  accuracy: number
  streakDays: number
  perfectDays: number
}

/** クイズ種別 */
export type QuizType = "news" | "scenario" | "psychology" | "history" | "basic"

/** クイズ選択肢 */
export interface QuizOption {
  id: number
  text: string
}

/** 個別クイズ履歴アイテム */
export interface QuizHistoryItem {
  quizType: QuizType
  isCorrect: boolean
  selectedOptionId: number
  /** 詳細表示用（optional） */
  title?: string
  question?: string
  options?: QuizOption[]
  correctOptionId?: number
  explanation?: string
}

/** 日別履歴 */
export interface DailyHistory {
  date: string
  quizzes: QuizHistoryItem[]
  correctCount: number
  totalQuizzes: number
}

/** 単一クイズデータ（クイズページ用） */
export interface SingleQuizData {
  quiz_type: QuizType
  title: string
  question: string
  options: QuizOption[]
  correct_option_id?: number
  explanation?: string
}

/** クイズ回答結果（クイズページ用） */
export interface QuizResult {
  isCorrect: boolean
  correctOptionId: number
  explanation: string
  gainedExp: number
  allCorrectBonus: number
  isGuest: boolean
}

/** クイズ試行情報 */
export interface QuizAttempt {
  answered: boolean
  isCorrect?: boolean
  selectedOptionId?: number
  gainedExp?: number
}

/** クイズ試行マップ（クイズ種別ごと） */
export type QuizAttemptsMap = Record<QuizType, QuizAttempt>
