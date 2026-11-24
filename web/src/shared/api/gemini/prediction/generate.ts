import { ai, GEMINI_MODEL } from "../client";
import { callGeminiWithRetry } from "../retry";
import {
  predictionQuestionSchema,
  predictionResolutionSchema,
  type PredictionQuestionOutput,
  type PredictionResolutionOutput,
} from "./schema";
import {
  buildPredictionQuestionPrompt,
  buildPredictionResolutionPrompt,
} from "./prompt";
import type { NewsArticle } from "@/shared/api/news-api";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

async function callGeminiJson(prompt: string): Promise<string> {
  const response = await callGeminiWithRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    }),
  );
  const text = response.text;
  if (!text) {throw new Error("Gemini APIからの応答が空です");}
  return text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
}

export async function generatePredictionQuestion(
  newsArticles: NewsArticle[],
  date: string,
): Promise<PredictionQuestionOutput> {
  const prompt = buildPredictionQuestionPrompt(newsArticles, date);
  const jsonText = await callGeminiJson(prompt);
  const result = predictionQuestionSchema.safeParse(JSON.parse(jsonText));
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    logger.warn("Prediction question schema validation failed", {
      module: LOG_MODULES.LIB.GEMINI_PREDICTION_GENERATE,
      date,
      errors,
    });
    throw new Error(`Prediction question schema validation failed: ${errors}`);
  }
  return result.data;
}

export async function generatePredictionResolution(
  contextSummary: string,
  question: string,
  date: string,
): Promise<PredictionResolutionOutput> {
  const prompt = buildPredictionResolutionPrompt(contextSummary, question, date);
  const jsonText = await callGeminiJson(prompt);
  const result = predictionResolutionSchema.safeParse(JSON.parse(jsonText));
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    logger.warn("Prediction resolution schema validation failed", {
      module: LOG_MODULES.LIB.GEMINI_PREDICTION_GENERATE,
      errors,
    });
    throw new Error(`Prediction resolution schema validation failed: ${errors}`);
  }
  return result.data;
}
