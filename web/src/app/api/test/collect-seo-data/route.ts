import { NextRequest, NextResponse } from "next/server";
import { collectSeoData } from "@/shared/api/seo/collect";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { verifyTestEndpoint } from "@/shared/lib/auth/verify-test-endpoint";
import { formatError } from "@/shared/lib/error-formatter";

export async function POST(request: NextRequest) {
  const authError = verifyTestEndpoint(request, LOG_MODULES.API.CRON_SEO_DATA);
  if (authError) {
    return authError;
  }

  try {
    const result = await collectSeoData();

    return NextResponse.json({
      message: "SEO data collected successfully",
      ...result,
    });
  } catch (error) {
    logger.error("Test SEO data collection error", {
      module: LOG_MODULES.API.CRON_SEO_DATA,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "SEOデータ収集中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
