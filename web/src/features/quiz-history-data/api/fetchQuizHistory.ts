/**
 * Quiz History Data Feature - API
 * クイズ履歴データ取得API
 */

import { client } from "@/shared/api"
import type { QuizStats, DailyHistory } from "@/entities/quiz"

export interface QuizHistoryResponse {
  stats: QuizStats | null
  history: DailyHistory[]
}

/**
 * クイズ履歴データを取得
 * @returns 統計情報と日別履歴
 */
export async function fetchQuizHistory(): Promise<QuizHistoryResponse> {
  const data = await client<QuizHistoryResponse>("/api/quiz/history", {
    params: { detailed: true },
  })

  return {
    stats: data.stats ?? null,
    history: data.history ?? [],
  }
}
