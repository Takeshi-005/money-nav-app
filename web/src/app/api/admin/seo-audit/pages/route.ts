import { NextResponse } from "next/server";
import { checkAdmin } from "@/shared/lib/auth";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { fetchPageAuditList } from "@/shared/api/seo/page-audit";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const rows = await fetchPageAuditList(supabase);
    return NextResponse.json({ rows });
  } catch (error) {
    logger.error("Failed to fetch SEO audit list", {
      module: LOG_MODULES.API.ADMIN_SEO_AUDIT,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "監査リストの取得に失敗しました" },
      { status: 500 },
    );
  }
}
