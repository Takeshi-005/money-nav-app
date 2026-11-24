import { z } from "zod"
import type { DailyQuizContent, DifficultyLevel } from "@/types/supabase"
import { ai, GEMINI_MODEL } from "../client"
import { callGeminiWithRetry } from "../retry"
import { logger } from "@/shared/lib/logger"
import { LOG_MODULES } from "@/shared/lib/log-modules"

export const judgeOutputSchema = z.object({
  thought: z.string(),
  is_valid: z.boolean(),
  scores: z.object({
    factual_accuracy: z.number().int().min(1).max(5),
    option_quality: z.number().int().min(1).max(5),
    explanation_quality: z.number().int().min(1).max(5),
    japan_relevance: z.number().int().min(1).max(5),
  }),
  error_type: z.enum([
    "factual_error",
    "ambiguous_correct_answer",
    "trivial_distractors",
    "weak_explanation",
    "japan_context_mismatch",
    "duplicate_concept",
    "none",
  ]),
  feedback_for_retry: z.string(),
  failing_quiz_indices: z.array(z.number().int().min(0).max(2)),
})

export type JudgeOutput = z.infer<typeof judgeOutputSchema>

const JUDGE_SYSTEM_PROMPT = `あなたは日本の金融教育コンテンツの品質審査員です。
提供された投資クイズセットを以下の基準で審査し、JSON形式で回答してください。

## 審査基準
1. 事実精度（factual_accuracy 1-5）: correct_option_idが指す選択肢が実際に正しいか
2. 選択肢品質（option_quality 1-5）: 3つの選択肢が明確に区別できるか（2択に見えないか）
3. 解説品質（explanation_quality 1-5）: 「なぜ他の選択肢が誤りか」まで説明できているか
4. 日本市場整合性（japan_relevance 1-5）: TSE・JPX・NISA・iDeCoなど日本固有の制度に矛盾がないか

## 重要な注意事項
- quiz_type="news" は時事問題のため事実検証は不要。選択肢品質・解説品質・整合性のみ審査する
- is_valid=true の条件: 全スコアが3以上、かつ明らかな事実誤りがないこと
- feedback_for_retry は is_valid=false の場合に具体的な修正指示を記述する（例: 「第0問のcorrect_option_idは2ではなく1です。PERが高い銘柄の特徴として...」）
- is_valid=true の場合は feedback_for_retry を空文字列にすること`

function buildJudgePrompt(
  quizContent: DailyQuizContent,
  difficulty: DifficultyLevel,
  marketContext: string
): string {
  return `難易度: ${difficulty}
市場コンテキスト: ${marketContext}

## 審査対象クイズ
${JSON.stringify(quizContent.quizzes, null, 2)}

上記のクイズセットを審査し、以下のJSON形式で回答してください:
{
  "thought": "判定の根拠となる思考プロセス（各クイズの問題点や良い点を具体的に）",
  "is_valid": true または false,
  "scores": {
    "factual_accuracy": 1〜5,
    "option_quality": 1〜5,
    "explanation_quality": 1〜5,
    "japan_relevance": 1〜5
  },
  "error_type": "factual_error",   // いずれか1つ: factual_error / ambiguous_correct_answer / trivial_distractors / weak_explanation / japan_context_mismatch / duplicate_concept / none
  "feedback_for_retry": "is_valid=falseの場合の具体的な修正指示（is_valid=trueの場合は空文字列）",
  "failing_quiz_indices": []   // 問題のあるクイズのインデックス（0始まり）
}`
}

export async function judgeQuizzes(
  quizContent: DailyQuizContent,
  difficulty: DifficultyLevel,
  marketContext: string
): Promise<JudgeOutput | null> {
  try {
    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          { role: "user", parts: [{ text: JUDGE_SYSTEM_PROMPT }] },
          { role: "model", parts: [{ text: "審査基準を理解しました。クイズセットを審査します。" }] },
          { role: "user", parts: [{ text: buildJudgePrompt(quizContent, difficulty, marketContext) }] },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      })
    )

    const text = response.text
    if (!text) {
      logger.warn("Judge response was empty", { module: LOG_MODULES.LIB.GEMINI_QUIZ_JUDGE })
      return null
    }

    const cleanText = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim()
    const parsed = judgeOutputSchema.safeParse(JSON.parse(cleanText))
    if (!parsed.success) {
      logger.warn("Judge response failed Zod validation", {
        module: LOG_MODULES.LIB.GEMINI_QUIZ_JUDGE,
        errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      })
      return null
    }

    return parsed.data
  } catch (error) {
    logger.warn("Judge API call failed, skipping evaluation", {
      module: LOG_MODULES.LIB.GEMINI_QUIZ_JUDGE,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
