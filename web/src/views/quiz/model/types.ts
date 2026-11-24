/**
 * Quiz Model Types
 * クイズモデルの型定義
 */

import type {
  QuizType,
  QuizAttemptsMap,
  SingleQuizData,
} from "@/entities/quiz"

/**
 * useActiveTab のパラメータ型
 */
export interface UseActiveTabParams {
  quizzes: SingleQuizData[] | undefined
  attempts: QuizAttemptsMap | undefined
}

/**
 * useActiveTab の戻り値型
 */
export interface UseActiveTabReturn {
  activeTab: QuizType
  setActiveTab: (tab: QuizType) => void
  resetToAutoMode: () => void
}

/**
 * useQuizOptions の戻り値型
 */
export interface UseQuizOptionsReturn {
  getSelected: (tab: QuizType) => number | null
  setSelected: (tab: QuizType, optionId: number) => void
  clearSelected: (tab: QuizType) => void
}
