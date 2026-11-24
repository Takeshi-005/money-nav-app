/**
 * Quiz History Data Feature - Public API
 * クイズ履歴データ取得機能
 */

// API
export { fetchQuizHistory, type QuizHistoryResponse } from "./api/fetchQuizHistory"

// Hooks
export { useQuizHistoryData, type UseQuizHistoryDataResult } from "./model/useQuizHistoryData"
