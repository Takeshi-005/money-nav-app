/**
 * Dashboard Data Feature - Type Definitions
 */
import type { UserData } from "@/entities/user"
import type { QuizSummary, QuizStats, DailyHistory } from "@/entities/quiz"
import type { DiagnosisAIResult } from "@/entities/diagnosis"

/** ダッシュボードで使用する統合データ型 */
export interface DashboardData {
  userData: UserData | null
  quizSummary: QuizSummary | null
  diagnosis: DiagnosisAIResult | null
  quizStats: QuizStats | null
  quizHistory: DailyHistory[]
}

/** useDashboardData フックの戻り値型 */
export interface UseDashboardDataResult {
  data: DashboardData
  isLoading: boolean
  error: Error | null
  refetch: () => void
}
