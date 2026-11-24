/**
 * Diagnosis Flow Feature - API
 * 診断API呼び出し
 */
import { client } from "@/shared/api"
import type { DiagnosisInput } from "@/types/supabase"
import type { DiagnosisResultWithGuest } from "../model/types"

/**
 * 診断を実行
 * @param answers 診断入力
 * @returns 診断結果
 */
export async function submitDiagnosis(
  answers: DiagnosisInput
): Promise<DiagnosisResultWithGuest> {
  return client<DiagnosisResultWithGuest>("/api/diagnosis", {
    method: "POST",
    body: answers,
  })
}
