/**
 * ゲストユーザー用localStorage操作ユーティリティ
 * 未ログイン状態での診断結果・クイズ回答を一時保存し、
 * ログイン後にサーバーに同期する
 *
 * v2: quiz_type対応（3問クイズ）
 */
import type { DiagnosisInput, DiagnosisAIResult, QuizType } from "@/types/supabase"

const STORAGE_KEYS = {
  DIAGNOSIS: "guest_diagnosis",
  QUIZ_ATTEMPTS: "guest_quiz_attempts",
  QUIZ_ATTEMPTS_V2: "guest_quiz_attempts_v2",
} as const

// 診断結果の保存構造
export interface GuestDiagnosis {
  input: DiagnosisInput
  result: DiagnosisAIResult
  createdAt: string // ISO 8601
  synced: boolean
}

// クイズ回答の保存構造（旧形式: 1問）
export interface GuestQuizAttemptLegacy {
  quizDate: string // YYYY-MM-DD
  selectedOptionId: number
  isCorrect: boolean
  gainedExp: number
  createdAt: string // ISO 8601
  synced: boolean
}

// クイズ回答の保存構造（新形式: 3問対応）
export interface GuestQuizAttempt {
  quizDate: string // YYYY-MM-DD
  quizType: QuizType // 'news' | 'basic' | 'scenario'
  selectedOptionId: number
  isCorrect: boolean
  gainedExp: number
  createdAt: string // ISO 8601
  synced: boolean
}

// === 診断 ===

export function saveGuestDiagnosis(data: GuestDiagnosis): void {
  if (typeof window === "undefined") {return}
  localStorage.setItem(STORAGE_KEYS.DIAGNOSIS, JSON.stringify(data))
}

export function getGuestDiagnosis(): GuestDiagnosis | null {
  if (typeof window === "undefined") {return null}
  const stored = localStorage.getItem(STORAGE_KEYS.DIAGNOSIS)
  return stored ? JSON.parse(stored) : null
}

// === クイズ ===

/**
 * クイズ回答を取得（v2形式 + 旧形式を統合）
 */
export function getGuestQuizAttempts(): GuestQuizAttempt[] {
  if (typeof window === "undefined") {return []}

  // v2形式を優先
  const storedV2 = localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS_V2)
  const attemptsV2: GuestQuizAttempt[] = storedV2 ? JSON.parse(storedV2) : []

  // 旧形式もマイグレーション
  const storedLegacy = localStorage.getItem(STORAGE_KEYS.QUIZ_ATTEMPTS)
  if (storedLegacy) {
    const legacyAttempts: GuestQuizAttemptLegacy[] = JSON.parse(storedLegacy)

    // 旧形式をv2形式に変換して追加（重複チェック）
    for (const legacy of legacyAttempts) {
      const exists = attemptsV2.some(
        (a) => a.quizDate === legacy.quizDate && a.quizType === "news"
      )
      if (!exists) {
        attemptsV2.push({
          ...legacy,
          quizType: "news", // 旧形式は全てnewsとして扱う
        })
      }
    }

    // 旧形式を削除してv2に統合
    localStorage.removeItem(STORAGE_KEYS.QUIZ_ATTEMPTS)
    localStorage.setItem(
      STORAGE_KEYS.QUIZ_ATTEMPTS_V2,
      JSON.stringify(attemptsV2)
    )
  }

  return attemptsV2
}

// === 同期用 ===

export interface UnsyncedData {
  diagnosis: GuestDiagnosis | null
  quizAttempts: GuestQuizAttempt[]
}

export function getUnsyncedData(): UnsyncedData {
  const diagnosis = getGuestDiagnosis()
  const quizAttempts = getGuestQuizAttempts()

  return {
    diagnosis: diagnosis?.synced === false ? diagnosis : null,
    quizAttempts: quizAttempts.filter((a) => !a.synced),
  }
}

export function clearGuestData(): void {
  if (typeof window === "undefined") {return}
  localStorage.removeItem(STORAGE_KEYS.DIAGNOSIS)
  localStorage.removeItem(STORAGE_KEYS.QUIZ_ATTEMPTS)
  localStorage.removeItem(STORAGE_KEYS.QUIZ_ATTEMPTS_V2)
}

// === ユーティリティ ===

export function hasUnsyncedData(): boolean {
  const { diagnosis, quizAttempts } = getUnsyncedData()
  return diagnosis !== null || quizAttempts.length > 0
}
