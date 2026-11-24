/**
 * Gemini API - Public API
 * 全機能を re-export
 */

// 共通
export { ai, GEMINI_MODEL } from "./client"
export { rateLimitedCall, callGeminiWithRetry, RATE_LIMIT_DELAY_MS } from "./retry"

// 診断
export { generateDiagnosis } from "./diagnosis"

// クイズ
export { generateDailyQuizzes } from "./quiz"

// 型は @/types/supabase から re-export
export type { DiagnosisInput, DiagnosisAIResult, DailyQuizContent } from "@/types/supabase"
