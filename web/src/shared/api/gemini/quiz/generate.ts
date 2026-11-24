import { zodToJsonSchema } from "zod-to-json-schema"
import type { DailyQuizContent, DifficultyLevel } from "@/types/supabase"
import { ai, GEMINI_MODEL } from "../client"
import { callGeminiWithRetry } from "../retry"
import { dailyQuizzesSchema } from "./schema"
import {
  buildDynamicQuizPrompt,
  QUIZ_PROMPT_VERSION,
  type QuizSeed,
  type PromptContext,
  type RecentQuizSummary,
} from "./prompt"
import {
  SUB_THEMES,
  MARKET_CONTEXTS,
  PERSONAS,
  selectRandomItem,
} from "./seeds"
import { selectDailyCategories } from "@/shared/config/quiz-generation"
import { judgeQuizzes, type JudgeOutput } from "./judge"
import { logger } from "@/shared/lib/logger"
import { LOG_MODULES } from "@/shared/lib/log-modules"

export interface GenerationAttemptRecord {
  attemptNumber: number
  judgeResult: JudgeOutput | null
  durationMs: number
  status: "success" | "failed" | "retried"
}

export interface GenerationResult {
  quizData: DailyQuizContent
  observability: { attempts: GenerationAttemptRecord[] }
  marketContext: string
  promptVersion: string
}

async function generateAttempt(context: PromptContext): Promise<DailyQuizContent> {
  const prompt = buildDynamicQuizPrompt(context)

  const quizzesJsonSchema = zodToJsonSchema(dailyQuizzesSchema, {
    $refStrategy: "none",
  }) as Record<string, unknown>
  delete quizzesJsonSchema.$schema

  const response = await callGeminiWithRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizzesJsonSchema,
      },
    })
  )

  const text = response.text
  if (!text) {
    throw new Error("Gemini APIからの応答が空です")
  }

  const parsed = dailyQuizzesSchema.parse(JSON.parse(text))

  const quizzesWithSubTheme = parsed.quizzes.map((quiz, index) => ({
    ...quiz,
    sub_theme: context.selectedSeeds[index]?.subTheme ?? undefined,
  }))

  return { quizzes: quizzesWithSubTheme }
}

export async function generateDailyQuizzes(
  recentQuizzes: RecentQuizSummary[] = [],
  difficulty: DifficultyLevel = "beginner"
): Promise<GenerationResult> {
  const selectedCategories = selectDailyCategories()

  const usedSubThemes = recentQuizzes
    .map((q) => q.subTheme)
    .filter((s): s is string => Boolean(s))

  const selectedSeeds: QuizSeed[] = selectedCategories.map((category) => {
    const allThemes = SUB_THEMES[category][difficulty]
    if (allThemes.length === 0) {
      return { category, subTheme: null }
    }
    const availableThemes = allThemes.filter((t) => !usedSubThemes.includes(t))
    const pool = availableThemes.length > 0 ? availableThemes : allThemes
    return { category, subTheme: selectRandomItem(pool) }
  })

  const marketContext = selectRandomItem(MARKET_CONTEXTS)
  const baseContext: PromptContext = {
    selectedSeeds,
    marketContext,
    persona: selectRandomItem(PERSONAS),
    recentQuizzes,
    difficulty,
  }

  const attempts: GenerationAttemptRecord[] = []

  // Attempt 1: 初回生成
  const start1 = Date.now()
  const quizData1 = await generateAttempt(baseContext)
  const judgeResult1 = await judgeQuizzes(quizData1, difficulty, marketContext)
  const durationMs1 = Date.now() - start1

  // Judgeがnull（APIエラー）またはis_valid=trueなら即返却
  if (judgeResult1 === null || judgeResult1.is_valid) {
    attempts.push({
      attemptNumber: 1,
      judgeResult: judgeResult1,
      durationMs: durationMs1,
      status: "success",
    })
    return { quizData: quizData1, observability: { attempts }, marketContext, promptVersion: QUIZ_PROMPT_VERSION }
  }

  // Attempt 1 が否定判定: フィードバックを渡してリトライ
  attempts.push({
    attemptNumber: 1,
    judgeResult: judgeResult1,
    durationMs: durationMs1,
    status: "retried",
  })
  logger.warn("Judge marked quiz invalid, retrying with feedback", {
    module: LOG_MODULES.LIB.GEMINI_QUIZ_GENERATE,
    errorType: judgeResult1.error_type,
    scores: judgeResult1.scores,
    feedback: judgeResult1.feedback_for_retry,
  })

  // Attempt 2: フィードバック付きリトライ
  const start2 = Date.now()
  const quizData2 = await generateAttempt({
    ...baseContext,
    judgeFeedback: judgeResult1.feedback_for_retry,
  })
  const judgeResult2 = await judgeQuizzes(quizData2, difficulty, marketContext)
  const durationMs2 = Date.now() - start2

  attempts.push({
    attemptNumber: 2,
    judgeResult: judgeResult2,
    durationMs: durationMs2,
    status: judgeResult2?.is_valid ? "success" : "failed",
  })

  if (judgeResult2 && !judgeResult2.is_valid) {
    // ベストエフォートで公開（cronルート側でSlack通知を行う）
    logger.warn("Judge marked quiz invalid after retry, will publish best-effort", {
      module: LOG_MODULES.LIB.GEMINI_QUIZ_GENERATE,
      errorType: judgeResult2.error_type,
      scores: judgeResult2.scores,
    })
  }

  return { quizData: quizData2, observability: { attempts }, marketContext, promptVersion: QUIZ_PROMPT_VERSION }
}
