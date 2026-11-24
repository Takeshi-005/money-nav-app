/**
 * Quiz History Data Feature - Hook
 * クイズ履歴データ管理フック（React Query版）
 */
"use client"

import { useQuery } from "@tanstack/react-query"
import type { QuizStats, DailyHistory } from "@/entities/quiz"
import { quizHistoryQueryOptions } from "./queryOptions"

export interface UseQuizHistoryDataResult {
  stats: QuizStats | null
  history: DailyHistory[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * クイズ履歴データを取得・管理するフック
 */
export function useQuizHistoryData(): UseQuizHistoryDataResult {
  const { data, isLoading, error, refetch } = useQuery(quizHistoryQueryOptions)

  return {
    stats: data?.stats ?? null,
    history: data?.history ?? [],
    isLoading,
    error: error ?? null,
    refetch,
  }
}
