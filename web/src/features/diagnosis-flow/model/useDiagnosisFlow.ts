"use client"

/**
 * Diagnosis Flow Feature - useDiagnosisFlow Hook
 * 診断フロー全体を管理するカスタムフック
 */
import { useState, useCallback } from "react"
import type { DiagnosisInput, DiagnosisAIResult } from "@/types/supabase"
import { useAuth } from "@/entities/session"
import { saveGuestDiagnosis } from "@/shared/lib/guest-storage"
import { submitDiagnosis } from "../api/submitDiagnosis"
import { TOTAL_STEPS, type Step, stepToAnswerKey } from "@/entities/diagnosis"

export interface UseDiagnosisFlowResult {
  step: Step
  answers: Partial<DiagnosisInput>
  result: DiagnosisAIResult | null
  isLoading: boolean
  error: string | null
  isGuest: boolean
  handleSelect: (value: string) => Promise<void>
  handleBack: () => void
  handleRetry: () => void
}

/**
 * 診断フローを管理するフック
 */
export function useDiagnosisFlow(): UseDiagnosisFlowResult {
  const { user } = useAuth()
  const isGuest = !user

  const [step, setStep] = useState<Step>(1)
  const [answers, setAnswers] = useState<Partial<DiagnosisInput>>({})
  const [result, setResult] = useState<DiagnosisAIResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 選択肢を選んだ時の処理
   */
  const handleSelect = useCallback(async (value: string) => {
    const key = stepToAnswerKey[step]
    const newAnswers = { ...answers, [key]: value }
    setAnswers(newAnswers)

    // 最後のステップなら診断実行
    if (step === TOTAL_STEPS) {
      setIsLoading(true)
      setError(null)

      try {
        const data = await submitDiagnosis(newAnswers as DiagnosisInput)
        setResult(data)

        // ゲストの場合はローカルストレージに保存
        if (isGuest && data) {
          saveGuestDiagnosis({
            input: newAnswers as DiagnosisInput,
            result: {
              typeCode: data.typeCode,
              investorType: data.investorType,
              resultText: data.resultText,
              famousQuote: data.famousQuote,
              strengths: data.strengths,
              weaknesses: data.weaknesses,
              actionAdvice: data.actionAdvice,
              recommendedSectors: data.recommendedSectors,
              suggestedTickers: data.suggestedTickers,
            },
            createdAt: new Date().toISOString(),
            synced: false,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "診断に失敗しました")
      } finally {
        setIsLoading(false)
      }
    } else {
      // 次のステップへ
      setStep((prev) => (prev + 1) as Step)
    }
  }, [step, answers, isGuest])

  /**
   * 戻るボタンの処理
   */
  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as Step)
    }
  }, [step])

  /**
   * リトライ処理
   */
  const handleRetry = useCallback(() => {
    setStep(1)
    setAnswers({})
    setResult(null)
    setError(null)
  }, [])

  return {
    step,
    answers,
    result,
    isLoading,
    error,
    isGuest,
    handleSelect,
    handleBack,
    handleRetry,
  }
}
