import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/api/supabase/server";
import {
  toNewsArticle,
  isValidDate,
  isNotFutureDate,
} from "@/entities/news-article";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;

  if (date) {
    if (!isValidDate(date) || !isNotFutureDate(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
  }

  try {
    const supabase = await createClient();

    const query = supabase
      .from("news_articles")
      .select("*")
      .eq("is_published", true);

    const { data, error } = date
      ? await query.eq("date", date).single()
      : await query.order("date", { ascending: false }).limit(1).single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 },
      );
    }

    const article = toNewsArticle(data);
    if (!article) {
      logger.error("Invalid news article data", {
        module: LOG_MODULES.API.NEWS_ARTICLES,
        date,
      });
      return NextResponse.json(
        { error: "Invalid article data" },
        { status: 500 },
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    logger.error("Error fetching news article", {
      module: LOG_MODULES.API.NEWS_ARTICLES,
      date,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
