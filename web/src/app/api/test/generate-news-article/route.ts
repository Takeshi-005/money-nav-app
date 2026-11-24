/**
 * ニュース解説記事生成テストAPI（開発環境専用）
 * プロンプト改善の効果検証や過去日付のテストに使用
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { generateNewsArticle } from "@/shared/api/gemini/news-article";
import { fetchMarketNews, type NewsArticle } from "@/shared/api/news-api";
import { findAllGlossaryTerms } from "@/entities/glossary-term";
import { getTodayDateStringJST } from "@/shared/lib/date";
import {
  isValidDate,
  isNotFutureDate,
} from "@/entities/news-article/lib/validators";
import type { Json } from "@/types/supabase";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { sendNewsArticleToSlack } from "@/shared/api/slack/send-news-notification";
import { verifyTestEndpoint } from "@/shared/lib/auth/verify-test-endpoint";
import { formatError } from "@/shared/lib/error-formatter";

interface TestGenerateNewsArticleRequest {
  date?: string;
  overwrite?: boolean;
}

export async function POST(request: NextRequest) {
  const authError = verifyTestEndpoint(
    request,
    LOG_MODULES.API.CRON_NEWS_ARTICLE,
  );
  if (authError) {
    return authError;
  }

  try {
    const body: TestGenerateNewsArticleRequest = await request.json();
    const date = body.date ?? getTodayDateStringJST();

    if (!isValidDate(date)) {
      return NextResponse.json(
        { error: `Invalid date format: ${date}. Use YYYY-MM-DD.` },
        { status: 400 },
      );
    }

    if (!isNotFutureDate(date)) {
      return NextResponse.json(
        { error: `Future dates are not allowed: ${date}` },
        { status: 400 },
      );
    }

    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json(
        { error: `${date} is a weekend. Markets are closed.` },
        { status: 400 },
      );
    }

    logger.info("Test news article generation started", {
      module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
      date,
    });

    let newsArticles: NewsArticle[] = [];
    let fetchError: string | undefined;
    try {
      newsArticles = await fetchMarketNews({ date, maxResults: 10 });
    } catch (error) {
      const formatted = formatError(error);
      fetchError = formatted.message;
      logger.error("Failed to fetch news articles", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        ...formatted,
      });
    }

    if (newsArticles.length === 0) {
      return NextResponse.json({
        message: "No news articles available for this date, skipping",
        date,
        skipped: true,
        reason: fetchError ?? "No articles returned from NewsAPI",
      });
    }

    const glossaryTerms = await findAllGlossaryTerms();
    const glossarySlugs = glossaryTerms.map((t) => ({
      term: t.term,
      slug: t.slug,
    }));

    const { content: articleContent } = await generateNewsArticle(
      newsArticles,
      date,
      glossarySlugs,
    );

    const supabase = createAdminClient();

    const { error } = await supabase.from("news_articles").upsert(
      {
        date,
        article_content: articleContent as unknown as Json,
      },
      { onConflict: "date" },
    );

    if (error) {
      logger.error("Supabase upsert error", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        error: error instanceof Error ? error.message : JSON.stringify(error),
      });
      throw error;
    }

    try {
      await sendNewsArticleToSlack(articleContent, date);
    } catch (error) {
      logger.warn("Slack notification failed", {
        module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
        ...formatError(error),
      });
    }

    return NextResponse.json({
      message: "News article generated successfully",
      date,
      article: {
        title: articleContent.title,
        theme: articleContent.theme,
      },
    });
  } catch (error) {
    logger.error("Test news article generation error", {
      module: LOG_MODULES.API.CRON_NEWS_ARTICLE,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "ニュース解説記事生成中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
