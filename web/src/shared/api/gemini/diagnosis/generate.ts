/**
 * 診断生成のメイン関数
 */
import { z } from "zod"
import type { DiagnosisInput, DiagnosisAIResult } from "@/types/supabase"
import { ai, GEMINI_MODEL } from "../client"
import { callGeminiWithRetry } from "../retry"
import { diagnosisSchema } from "./schema"
import { buildDiagnosisPrompt } from "./prompt"

export async function generateDiagnosis(
  input: DiagnosisInput
): Promise<DiagnosisAIResult> {
  const prompt = buildDiagnosisPrompt(input);
  const diagnosisJsonSchema = z.toJSONSchema(diagnosisSchema) as Record<string, unknown>;
  delete diagnosisJsonSchema.$schema;

  const response = await callGeminiWithRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: diagnosisJsonSchema,
      },
    })
  );

  const text = response.text;
  if (!text) {
    throw new Error("Gemini APIからの応答が空です");
  }

  const parsed = JSON.parse(text);
  return diagnosisSchema.parse(parsed);
}
