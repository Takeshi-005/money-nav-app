import { ai, GEMINI_MODEL } from "../client";
import { callGeminiWithRetry } from "../retry";
import { newsArticleContentSchema } from "./schema";
import {
  buildNewsArticlePrompt,
  NEWS_ARTICLE_PROMPT_VERSION,
  type GlossarySlugEntry,
} from "./prompt";
import { createNewsArticleJudge } from "./judge";
import { fetchMarketSnapshot, type MarketSnapshot } from "./market-snapshot";
import {
  withFeedbackRetry,
  type GenerationAttemptRecord,
} from "../shared/with-feedback-retry";
import type { NewsArticleContent } from "@/types/supabase";
import type { NewsArticle } from "@/shared/api/news-api";
import type { DemandKeyword } from "@/shared/api/seo/demand-keywords";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

export interface NewsArticleGenerationResult {
  content: NewsArticleContent;
  observability: { attempts: GenerationAttemptRecord[] };
  promptVersion: string;
}

async function generateAttempt(
  newsArticles: NewsArticle[],
  date: string,
  glossaryTerms?: GlossarySlugEntry[],
  judgeFeedback?: string,
  demandKeywords?: DemandKeyword[],
  marketSnapshot?: MarketSnapshot | null,
): Promise<NewsArticleContent> {
  const prompt = buildNewsArticlePrompt(
    newsArticles,
    date,
    glossaryTerms,
    judgeFeedback,
    demandKeywords,
    marketSnapshot,
  );

  const response = await callGeminiWithRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.2 },
    }),
  );

  const text = response.text;
  if (!text) {
    throw new Error("Gemini APIからの応答が空です");
  }

  const jsonText = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const result = newsArticleContentSchema.safeParse(JSON.parse(jsonText));
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    logger.warn("NewsArticle Gemini response failed Zod validation", {
      module: LOG_MODULES.LIB.GEMINI_NEWS_ARTICLE_GENERATE,
      date,
      errors: result.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      ),
    });
    throw new Error(
      `Gemini response schema validation failed: ${errorDetails}`,
    );
  }
  return result.data;
}

export async function generateNewsArticle(
  newsArticles: NewsArticle[],
  date: string,
  glossaryTerms?: GlossarySlugEntry[],
  demandKeywords?: DemandKeyword[],
): Promise<NewsArticleGenerationResult> {
  const newsContext = newsArticles
    .slice(0, 5)
    .map((a, i) => `${i + 1}. ${a.title}`)
    .join("\n");

  const marketSnapshot = await fetchMarketSnapshot(date);

  const judge = createNewsArticleJudge(newsContext, marketSnapshot);

  const { content, attempts } = await withFeedbackRetry(
    (feedback?) =>
      generateAttempt(
        newsArticles,
        date,
        glossaryTerms,
        feedback,
        demandKeywords,
        marketSnapshot,
      ),
    judge,
    LOG_MODULES.LIB.GEMINI_NEWS_ARTICLE_GENERATE,
  );

  return {
    content,
    observability: { attempts },
    promptVersion: NEWS_ARTICLE_PROMPT_VERSION,
  };
}
