import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { sendNewsArticleToSlack } from "@/shared/api/slack/send-news-notification";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { verifyTestEndpoint } from "@/shared/lib/auth/verify-test-endpoint";
import { formatError } from "@/shared/lib/error-formatter";
import type { NewsArticleContent } from "@/types/supabase";

export async function POST(request: NextRequest) {
  const authError = verifyTestEndpoint(
    request,
    LOG_MODULES.API.TEST_SLACK_NOTIFICATION,
  );
  if (authError) {
    return authError;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("news_articles")
    .select("article_content, date")
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    logger.error("Failed to fetch news article from Supabase", {
      module: LOG_MODULES.API.TEST_SLACK_NOTIFICATION,
      error: error ? error.message : "No articles found",
    });
    return NextResponse.json(
      { error: "No news articles found in database" },
      { status: 404 },
    );
  }

  try {
    await sendNewsArticleToSlack(
      data.article_content as unknown as NewsArticleContent,
      data.date,
    );

    logger.info("Slack test notification sent successfully", {
      module: LOG_MODULES.API.TEST_SLACK_NOTIFICATION,
      date: data.date,
    });

    return NextResponse.json({
      message: "Slack notification sent successfully",
      date: data.date,
    });
  } catch (err) {
    const formatted = formatError(err);
    logger.error("Slack notification failed", {
      module: LOG_MODULES.API.TEST_SLACK_NOTIFICATION,
      ...formatted,
    });
    return NextResponse.json(
      { error: "Slack notification failed", detail: formatted.message },
      { status: 500 },
    );
  }
}
