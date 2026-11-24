/**
 * ニュース解説記事生成Cron API
 * 日次自動生成は停止済み（Cloud Schedulerジョブ削除済み）。
 * 手動再生成用に /api/test/generate-news-article から呼び出される
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { generateNewsArticle } from "@/shared/api/gemini/news-article";
import { fetchMarketNews, type NewsArticle } from "@/shared/api/news-api";
import { findAllGlossaryTerms } from "@/entities/glossary-term";
import { fetchDemandKeywords } from "@/shared/api/seo/demand-keywords";
import type { DemandKeyword } from "@/shared/api/seo/demand-keywords";
import {
  getTodayDateStringJST,
  getYesterdayDateStringJST,
} from "@/shared/lib/date";
import type { Json } from "@/types/supabase";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { verifySchedulerToken } from "@/shared/lib/verify-scheduler-token";
import { sendNewsArticleToSlack } from "@/shared/api/slack/send-news-notification";
import { sendBatchErrorToSlack } from "@/shared/api/slack/send-batch-error-notification";
import { notifySearchEngines } from "@/shared/api/search-engines/notify";
import { GEMINI_MODEL } from "@/shared/api/gemini/client";
import { formatError } from "@/shared/lib/error-formatter";
import { isRateLimitError } from "@/shared/lib/api-errors";

const NEWS_MAX_RESULTS = 10;
const NEWS_CONTEXT_TOP_COUNT = 3;

async function writeObservabilityLogs(
  supabase: ReturnType<typeof createAdminClient>,
  today: string,
  newsContext: string,
  promptVersion: string,
  observability: {
    attempts: Array<{
      attemptNumber: number;
      judgeResult: unknown;
      durationMs: number;
      status: string;
    }>;
  },
): Promise<void> {
  for (const attempt of observability.attempts) {
    try {
      const { data: generationRecord, error: genError } = await supabase
        .from("ai_generations")
        .insert({
          generation_date: today,
          content_type: "news_article",
          difficulty: "beginner",
          prompt_version: promptVersion,
          attempt_number: attempt.attemptNumber,
          model: GEMINI_MODEL,
          input_context: { newsContext, date: today },
          duration_ms: attempt.durationMs,
          status: attempt.status,
        })
        .select("id")
        .single();

      if (genError || !generationRecord) {
        continue;
      }

      if (attempt.judgeResult) {
        const judge = attempt.judgeResult as {
          is_valid: boolean;
          scores: unknown;
          error_type: string;
          feedback_for_retry: string;
          thought: string;
        };
        await supabase.from("ai_evaluations").insert({
          generation_id: generationRecord.id,
          evaluator_model: GEMINI_MODEL,
          is_valid: judge.is_valid,
          scores: judge.scores as Json,
          error_type: judge.error_type,
          feedback_for_retry: judge.feedback_for_retry || null,
          failing_quiz_indices: [],
          thought: judge.thought,
        });
      }
    } catch (err) {
      logger.warn("Failed to write observability log", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        ...formatError(err),
        attemptNumber: attempt.attemptNumber,
      });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const isValid = await verifySchedulerToken(
      request.headers.get("authorization"),
    );
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const force = (body as { force?: boolean }).force === true;

    const today = getTodayDateStringJST();
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("news_articles")
      .select("date")
      .eq("date", today)
      .eq("is_published", true)
      .maybeSingle();

    if (existing && !force) {
      return NextResponse.json({
        message: "Article already exists for today",
        date: today,
      });
    }

    if (existing && force) {
      logger.info("Force regeneration: overwriting existing article", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        date: today,
      });
    }

    let newsArticles: NewsArticle[] = [];
    try {
      newsArticles = await fetchMarketNews({
        date: today,
        maxResults: NEWS_MAX_RESULTS,
      });
    } catch (error) {
      logger.error("Failed to fetch news articles", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        ...formatError(error),
      });
    }

    if (newsArticles.length === 0) {
      const yesterday = getYesterdayDateStringJST();
      logger.warn("No news for today, falling back to previous day", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        today,
        yesterday,
      });
      try {
        newsArticles = await fetchMarketNews({
          date: yesterday,
          maxResults: NEWS_MAX_RESULTS,
        });
      } catch (error) {
        logger.error("Failed to fetch fallback news articles", {
          module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
          ...formatError(error),
        });
      }
    }

    if (newsArticles.length === 0) {
      logger.warn("No news articles found after fallback, skipping generation", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        date: today,
      });
      try {
        await sendBatchErrorToSlack(
          "news-article-generator",
          `本日（${today}）のニュースを取得できなかったため、記事生成をスキップしました`,
          "Google News RSS から該当キーワードのニュースが0件でした。前日分のフォールバックでも取得できませんでした。",
        );
      } catch {
        // best-effort
      }
      return NextResponse.json({
        message: "No news articles available today, skipping",
        date: today,
        skipped: true,
      });
    }

    let glossarySlugs: { term: string; slug: string }[] = [];
    try {
      const glossaryTerms = await findAllGlossaryTerms();
      glossarySlugs = glossaryTerms.map((t) => ({
        term: t.term,
        slug: t.slug,
      }));
    } catch (error) {
      logger.warn("Glossary terms fetch failed, continuing without glossary", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        ...formatError(error),
      });
    }

    let demandKeywords: DemandKeyword[] = [];
    try {
      demandKeywords = await fetchDemandKeywords(supabase, {
        weeks: 4,
        minImpressions: 3,
        limit: 20,
      });
      logger.info("Demand keywords fetched for prompt", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        count: demandKeywords.length,
      });
    } catch (error) {
      logger.warn("Demand keywords fetch failed, continuing without them", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        ...formatError(error),
      });
    }

    const {
      content: articleContent,
      observability,
      promptVersion,
    } = await generateNewsArticle(newsArticles, today, glossarySlugs, demandKeywords);

    const newsContext = newsArticles
      .slice(0, NEWS_CONTEXT_TOP_COUNT)
      .map((a) => a.title)
      .join("; ");
    await writeObservabilityLogs(
      supabase,
      today,
      newsContext,
      promptVersion,
      observability,
    );

    const lastAttempt = observability.attempts.at(-1);
    if (lastAttempt?.status === "failed") {
      logger.warn(
        "Published news article with best-effort: Judge failed twice",
        {
          module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
          date: today,
        },
      );
    }

    const { error } = await supabase.from("news_articles").upsert(
      {
        date: today,
        article_content: articleContent as unknown as Json,
      },
      { onConflict: "date" },
    );

    if (error) {
      logger.error("Supabase upsert error", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    try {
      await sendNewsArticleToSlack(articleContent, today);
    } catch (error) {
      logger.warn("Slack notification failed", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        ...formatError(error),
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (baseUrl) {
      try {
        await notifySearchEngines([
          `${baseUrl}/news-articles/${today}`,
          `${baseUrl}/news-articles`,
        ]);
      } catch (error) {
        logger.warn("Search engine notification failed", {
          module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
          ...formatError(error),
        });
      }
    }

    return NextResponse.json({
      message: "News article generated successfully",
      date: today,
      article: {
        title: articleContent.title,
        theme: articleContent.theme,
      },
      attempts: observability.attempts.length,
      publishedWithWarning: lastAttempt?.status === "failed",
    });
  } catch (error) {
    logger.error("News article generation error", {
      module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
      ...formatError(error),
    });
    if (isRateLimitError(error)) {
      return NextResponse.json(
        {
          error:
            "AIサービスが混雑しています。しばらく待ってから再度お試しください。",
          code: "RATE_LIMIT",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "ニュース解説記事生成中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
