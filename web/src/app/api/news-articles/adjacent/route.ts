import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/api/supabase/server";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";
import { SUPABASE_ERROR_CODES } from "@/shared/lib/supabase-errors";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "日付パラメータが必要です" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const [prevResult, nextResult] = await Promise.all([
      supabase
        .from("news_articles")
        .select("date")
        .lt("date", date)
        .order("date", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("news_articles")
        .select("date")
        .gt("date", date)
        .order("date", { ascending: true })
        .limit(1)
        .single(),
    ]);

    if (
      prevResult.error &&
      prevResult.error.code !== SUPABASE_ERROR_CODES.NO_ROWS
    ) {
      logger.warn("Error fetching previous news article date", {
        module: LOG_MODULES.API.NEWS_ARTICLES,
        error: prevResult.error.message,
      });
    }

    if (
      nextResult.error &&
      nextResult.error.code !== SUPABASE_ERROR_CODES.NO_ROWS
    ) {
      logger.warn("Error fetching next news article date", {
        module: LOG_MODULES.API.NEWS_ARTICLES,
        error: nextResult.error.message,
      });
    }

    return NextResponse.json({
      prevDate: prevResult.data?.date || null,
      nextDate: nextResult.data?.date || null,
    });
  } catch (error) {
    logger.error("Error fetching adjacent news article dates", {
      module: LOG_MODULES.API.NEWS_ARTICLES,
      ...formatError(error),
    });

    return NextResponse.json(
      { error: "前後の日付の取得に失敗しました" },
      { status: 500 },
    );
  }
}
