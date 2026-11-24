import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/shared/lib/auth";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { notifySearchEngines } from "@/shared/api/search-engines/notify";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";

export const dynamic = "force-dynamic";

interface ApplyBody {
  pagePath: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords?: string[];
}

const NEWS_ARTICLE_PATH = /^\/news-articles\/(\d{4}-\d{2}-\d{2})$/;

function validate(body: unknown): body is ApplyBody {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const b = body as Record<string, unknown>;
  return (
    typeof b.pagePath === "string" &&
    typeof b.seoTitle === "string" &&
    b.seoTitle.length > 0 &&
    b.seoTitle.length <= 80 &&
    typeof b.seoDescription === "string" &&
    b.seoDescription.length > 0 &&
    b.seoDescription.length <= 200
  );
}

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON parse error" }, { status: 400 });
  }
  if (!validate(body)) {
    return NextResponse.json(
      { error: "リクエスト形式が不正です（pagePath/seoTitle/seoDescription必須）" },
      { status: 400 },
    );
  }

  const match = body.pagePath.match(NEWS_ARTICLE_PATH);
  if (!match) {
    return NextResponse.json(
      {
        error:
          "DB上書きはニュース記事のみ対応です。静的・診断結果ページは shared/config/seo-overrides.ts へのコードPRが必要です",
      },
      { status: 400 },
    );
  }
  const date = match[1];

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("news_articles")
      .update({
        seo_title: body.seoTitle,
        seo_description: body.seoDescription,
        seo_keywords: body.seoKeywords ?? null,
        seo_updated_at: new Date().toISOString(),
        seo_updated_by: admin.id,
      })
      .eq("date", date);

    if (error) {
      throw error;
    }

    revalidatePath(`/news-articles/${date}`);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (baseUrl) {
      try {
        await notifySearchEngines([`${baseUrl}${body.pagePath}`]);
      } catch (notifyError) {
        logger.warn("notifySearchEngines failed (non-fatal)", {
          module: LOG_MODULES.API.ADMIN_SEO_AUDIT,
          ...formatError(notifyError),
        });
      }
    }

    await supabase
      .from("seo_insights")
      .update({
        status: "completed",
        action_taken: `SEOタイトル改善: ${body.seoTitle}`,
        action_completed_at: new Date().toISOString().split("T")[0],
      })
      .eq("target_page", body.pagePath)
      .eq("status", "new");

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Failed to apply SEO override", {
      module: LOG_MODULES.API.ADMIN_SEO_AUDIT,
      pagePath: body.pagePath,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "DB更新に失敗しました" },
      { status: 500 },
    );
  }
}
