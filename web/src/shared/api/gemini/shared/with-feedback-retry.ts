import { logger } from "@/shared/lib/logger"

export interface GenerationAttemptRecord {
  attemptNumber: number
  judgeResult: unknown
  durationMs: number
  status: "success" | "failed" | "retried"
}

type JudgeBase = { is_valid: boolean; feedback_for_retry: string }

interface GenerateAttempt<TContent> {
  content?: TContent
  error?: unknown
}

async function runGenerate<TContent>(
  generate: (feedback?: string) => Promise<TContent>,
  feedback: string | undefined,
): Promise<GenerateAttempt<TContent>> {
  try {
    return { content: await generate(feedback) }
  } catch (error) {
    return { error }
  }
}

function errorMessageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * generate() が例外を投げた場合に retry へ渡すフィードバック文言を組み立てる。
 * Zod バリデーション失敗 / JSON.parse 失敗 / Gemini API 失敗 などを要約する。
 */
function buildGenerateErrorFeedback(error: unknown): string {
  const message = errorMessageOf(error)

  if (message.startsWith("Gemini response schema validation failed")) {
    const details = message.replace(/^Gemini response schema validation failed:\s*/, "")
    return `前回出力はスキーマ違反で失敗しました（詳細: ${details.slice(0, 200)}）。指定された型・必須項目・文字数制限を厳守し、有効なJSONのみを返してください。`
  }

  if (error instanceof SyntaxError || /JSON|Unexpected token/i.test(message)) {
    return "前回出力はJSONとしてパースできませんでした。コードフェンスやMarkdown装飾を含めず、有効なJSONオブジェクトのみを返してください。全ての文字列内改行は \\n にエスケープしてください。"
  }

  if (message.includes("応答が空")) {
    return "前回出力は空でした。指定された全フィールドを必須で埋めた有効なJSONを返してください。"
  }

  return "前回生成は失敗しました。指定スキーマ・文字数制限を厳守し、有効なJSONのみを返してください。"
}

export async function withFeedbackRetry<TContent, TJudge extends JudgeBase>(
  generate: (feedback?: string) => Promise<TContent>,
  judge: (content: TContent) => Promise<TJudge | null>,
  module: string,
): Promise<{ content: TContent; attempts: GenerationAttemptRecord[] }> {
  const attempts: GenerationAttemptRecord[] = []

  // --- attempt 1 ---
  const start1 = Date.now()
  const r1 = await runGenerate(generate, undefined)
  const durationMs1 = Date.now() - start1

  let feedbackForRetry: string | undefined
  if (r1.error) {
    attempts.push({
      attemptNumber: 1,
      judgeResult: { error: errorMessageOf(r1.error) },
      durationMs: durationMs1,
      status: "retried",
    })
    logger.warn("Generate threw before judge, retrying with feedback", {
      module,
      errorMessage: errorMessageOf(r1.error),
    })
    feedbackForRetry = buildGenerateErrorFeedback(r1.error)
  } else {
    const judgeResult1 = await judge(r1.content!)
    if (judgeResult1 === null || judgeResult1.is_valid) {
      attempts.push({
        attemptNumber: 1,
        judgeResult: judgeResult1,
        durationMs: durationMs1,
        status: "success",
      })
      return { content: r1.content!, attempts }
    }
    attempts.push({
      attemptNumber: 1,
      judgeResult: judgeResult1,
      durationMs: durationMs1,
      status: "retried",
    })
    logger.warn("Judge marked content invalid, retrying with feedback", {
      module,
      feedback: judgeResult1.feedback_for_retry,
    })
    feedbackForRetry = judgeResult1.feedback_for_retry
  }

  // --- attempt 2 ---
  const start2 = Date.now()
  const r2 = await runGenerate(generate, feedbackForRetry)
  const durationMs2 = Date.now() - start2

  if (r2.error) {
    attempts.push({
      attemptNumber: 2,
      judgeResult: { error: errorMessageOf(r2.error) },
      durationMs: durationMs2,
      status: "failed",
    })
    logger.warn("Generate threw twice, giving up", {
      module,
      errorMessage: errorMessageOf(r2.error),
    })
    throw r2.error
  }

  const judgeResult2 = await judge(r2.content!)
  attempts.push({
    attemptNumber: 2,
    judgeResult: judgeResult2,
    durationMs: durationMs2,
    status: judgeResult2?.is_valid ? "success" : "failed",
  })
  if (judgeResult2 && !judgeResult2.is_valid) {
    logger.warn("Judge marked content invalid after retry, publishing best-effort", { module })
  }
  return { content: r2.content!, attempts }
}
