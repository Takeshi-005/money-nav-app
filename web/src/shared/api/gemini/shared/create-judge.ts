import { z } from "zod"
import { ai, GEMINI_MODEL } from "../client"
import { callGeminiWithRetry } from "../retry"
import { logger } from "@/shared/lib/logger"

export interface JudgeConfig<TContent, TOutput> {
  systemPrompt: string
  buildUserPrompt: (content: TContent) => string
  outputSchema: z.ZodType<TOutput>
  module: string
}

export function createJudge<TContent, TOutput>(
  config: JudgeConfig<TContent, TOutput>,
): (content: TContent) => Promise<TOutput | null> {
  return async function judge(content: TContent): Promise<TOutput | null> {
    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            { role: "user", parts: [{ text: config.systemPrompt }] },
            { role: "model", parts: [{ text: "審査基準を理解しました。審査を行います。" }] },
            { role: "user", parts: [{ text: config.buildUserPrompt(content) }] },
          ],
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      )

      const text = response.text
      if (!text) {
        logger.warn("Judge response was empty", { module: config.module })
        return null
      }

      const cleanText = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim()
      const parsed = config.outputSchema.safeParse(JSON.parse(cleanText))
      if (!parsed.success) {
        logger.warn("Judge response failed Zod validation", {
          module: config.module,
          errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        })
        return null
      }

      return parsed.data
    } catch (error) {
      logger.warn("Judge API call failed, skipping evaluation", {
        module: config.module,
        error: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }
}
