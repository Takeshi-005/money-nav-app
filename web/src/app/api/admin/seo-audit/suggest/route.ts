import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/shared/lib/auth";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { suggestSeoTitle } from "@/shared/api/seo/title-suggester";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { pagePath?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON parse error" }, { status: 400 });
  }
  if (!body.pagePath) {
    return NextResponse.json(
      { error: "pagePath が必須です" },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const suggestion = await suggestSeoTitle(supabase, body.pagePath);
    return NextResponse.json({ suggestion });
  } catch (error) {
    logger.error("Failed to generate SEO suggestion", {
      module: LOG_MODULES.API.ADMIN_SEO_AUDIT,
      pagePath: body.pagePath,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "改善案の生成に失敗しました" },
      { status: 500 },
    );
  }
}
