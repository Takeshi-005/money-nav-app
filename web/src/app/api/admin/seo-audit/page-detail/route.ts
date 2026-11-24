import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/shared/lib/auth";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { fetchPageAuditDetail } from "@/shared/api/seo/page-audit";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pagePath = request.nextUrl.searchParams.get("path");
  if (!pagePath) {
    return NextResponse.json(
      { error: "path クエリパラメータが必須です" },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const detail = await fetchPageAuditDetail(supabase, pagePath);
    if (!detail) {
      return NextResponse.json(
        { error: "対象ページが監査対象に含まれていません" },
        { status: 404 },
      );
    }
    return NextResponse.json({ detail });
  } catch (error) {
    logger.error("Failed to fetch SEO audit detail", {
      module: LOG_MODULES.API.ADMIN_SEO_AUDIT,
      pagePath,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "ページ詳細の取得に失敗しました" },
      { status: 500 },
    );
  }
}
