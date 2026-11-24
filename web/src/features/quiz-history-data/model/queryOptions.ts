/**
 * Quiz History Query Options
 * React Query のクエリオプション定義
 */
import { createQueryOptions, queryKeys } from "@/shared/api/query-client"
import { fetchQuizHistory, type QuizHistoryResponse } from "../api/fetchQuizHistory"

export const quizHistoryQueryOptions = createQueryOptions<QuizHistoryResponse>({
  queryKey: queryKeys.quiz.historyDetailed(),
  queryFn: fetchQuizHistory,
})
