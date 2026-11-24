/**
 * Diagnosis Flow Feature - Type Definitions
 */
import type { Step } from "@/entities/diagnosis"
import type { DiagnosisInput, DiagnosisAIResult } from "@/types/supabase"

/** 診断フローの状態 */
export interface DiagnosisFlowState {
  step: Step
  answers: Partial<DiagnosisInput>
  result: DiagnosisAIResult | null
  isLoading: boolean
  error: string | null
}

/** 診断結果（ゲストフラグ付き） */
export interface DiagnosisResultWithGuest extends DiagnosisAIResult {
  isGuest?: boolean
}

/** useDiagnosisFlow フックの戻り値 */
export interface UseDiagnosisFlowResult {
  step: Step
  answers: Partial<DiagnosisInput>
  result: DiagnosisResultWithGuest | null
  isLoading: boolean
  error: string | null
  handleSelect: (value: string) => Promise<void>
  handleBack: () => void
  handleRetry: () => void
}
