/**
 * Dashboard Data Feature - API
 * ダッシュボードで必要なデータを並列取得
 */
import { client } from "@/shared/api"
import type { DashboardData } from "../model/types"
import type { QuizSummary, QuizStats, DailyHistory, QuizHistoryItem } from "@/entities/quiz"
import type { DiagnosisAIResult } from "@/entities/diagnosis"

interface QuizApiResponse {
  quizzes?: unknown[]
  attempts?: Record<string, { answered?: boolean; isCorrect?: boolean }>
  allCorrectBonus?: number
}

interface DiagnosisApiResponse {
  diagnosis?: DiagnosisAIResult
  experience?: number
}

interface HistoryApiResponse {
  stats?: QuizStats
  history?: {
    date: string
    quizzes: QuizHistoryItem[]
    correctCount: number
    totalQuizzes: number
  }[]
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [quizRes, diagnosisRes, historyRes] =
    await Promise.allSettled([
      client<QuizApiResponse>("/api/quiz"),
      client<DiagnosisApiResponse>("/api/diagnosis"),
      client<HistoryApiResponse>("/api/quiz/history", { params: { limit: 5 } }),
    ])

  // デフォルト値
  let quizSummary: QuizSummary | null = null
  let userData = null
  let diagnosis = null
  let quizStats: QuizStats | null = null
  let quizHistory: DailyHistory[] = []

  // クイズサマリーを解析
  if (quizRes.status === "fulfilled") {
    const quizData = quizRes.value
    if (quizData.quizzes) {
      const attempts = quizData.attempts || {}
      const attemptValues = Object.values(attempts)
      const answeredCount = attemptValues.filter((a) => a?.answered).length
      const correctCount = attemptValues.filter((a) => a?.isCorrect).length
      quizSummary = {
        totalQuizzes: quizData.quizzes.length,
        answeredCount,
        correctCount,
        allCorrectBonus: quizData.allCorrectBonus || 0,
      }
    }
  }

  // 診断結果とプロフィール情報を解析
  if (diagnosisRes.status === "fulfilled") {
    const diagnosisData = diagnosisRes.value
    if (diagnosisData.diagnosis) {
      diagnosis = diagnosisData.diagnosis
    }
    userData = {
      level: 1,
      experience: diagnosisData.experience ?? 0,
      investmentStyle: diagnosisData.diagnosis?.investorType ?? null,
    }
  }

  // クイズ履歴を解析
  if (historyRes.status === "fulfilled") {
    const historyData = historyRes.value
    if (historyData.stats) {
      quizStats = historyData.stats
    }
    quizHistory = historyData.history || []
  }

  return {
    userData,
    quizSummary,
    diagnosis,
    quizStats,
    quizHistory,
  }
}
