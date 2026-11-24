import { NextRequest, NextResponse } from "next/server";
import { collectSeoData } from "@/shared/api/seo/collect";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { verifySchedulerToken } from "@/shared/lib/verify-scheduler-token";
import {
  sendBatchErrorToSlack,
  sendBatchSuccessToSlack,
} from "@/shared/api/slack/send-batch-error-notification";
import { formatError } from "@/shared/lib/error-formatter";

export async function POST(request: NextRequest) {
  try {
    const isValid = await verifySchedulerToken(
      request.headers.get("authorization"),
    );
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await collectSeoData();

    await sendBatchSuccessToSlack(
      "SEOデータ収集",
      `📊 検索クエリ: ${result.searchRows}件 | ページ: ${result.pageRows}件 | インサイト: ${result.insightsCount}件\nCTR: ${(result.summary.avgCtr * 100).toFixed(2)}% | 平均順位: ${result.summary.avgPosition.toFixed(1)}`,
    );

    return NextResponse.json({
      message: "SEO data collected successfully",
      ...result,
    });
  } catch (error) {
    const formatted = formatError(error);

    logger.error("SEO data collection cron error", {
      module: LOG_MODULES.API.CRON_SEO_DATA,
      ...formatted,
    });

    await sendBatchErrorToSlack(
      "SEOデータ収集",
      formatted.message,
      formatted.stack,
    );

    return NextResponse.json(
      { error: "SEOデータ収集中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
