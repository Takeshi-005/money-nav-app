import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/shared/lib/auth";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { enrichGlossaryTerm } from "@/shared/api/gemini/glossary";
import { notifySearchEngines } from "@/shared/api/search-engines/notify";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";

export const dynamic = "force-dynamic";

interface BackfillBody {
  slugs?: string[];
  limit?: number;
}

type GlossaryRow = {
  slug: string;
  term: string;
  reading: string;
  category: string;
  difficulty: string;
  definition: string;
  explanation: string;
};

export async function POST(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: BackfillBody = {};
  try {
    const raw = await request.text();
    if (raw) {
      body = JSON.parse(raw) as BackfillBody;
    }
  } catch {
    return NextResponse.json({ error: "JSON parse error" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: rows, error: fetchError } = await supabase
    .from("glossary_terms")
    .select("slug, term, reading, category, difficulty, definition, explanation");

  if (fetchError) {
    logger.error("Failed to fetch glossary terms", {
      module: LOG_MODULES.API.ADMIN_GLOSSARY_BACKFILL,
      error: fetchError.message,
    });
    return NextResponse.json(
      { error: "用語の取得に失敗しました" },
      { status: 500 },
    );
  }

  const allRows = (rows ?? []) as GlossaryRow[];
  const availableSlugs = allRows.map((r) => r.slug);

  let targets = allRows;
  if (body.slugs && body.slugs.length > 0) {
    const set = new Set(body.slugs);
    targets = allRows.filter((r) => set.has(r.slug));
  } else if (typeof body.limit === "number" && body.limit > 0) {
    targets = allRows.slice(0, body.limit);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const updatedUrls: string[] = [];
  const failed: { slug: string; error: string }[] = [];

  for (const target of targets) {
    try {
      const enriched = await enrichGlossaryTerm(target, availableSlugs);

      const { error: updateError } = await supabase
        .from("glossary_terms")
        .update({
          explanation: enriched.explanation,
          example: enriched.example,
          related_terms: enriched.related_terms,
        })
        .eq("slug", target.slug);

      if (updateError) {
        throw updateError;
      }

      revalidatePath(`/glossary/${target.slug}`);
      if (baseUrl) {
        updatedUrls.push(`${baseUrl}/glossary/${target.slug}`);
      }
    } catch (error) {
      const formatted = formatError(error);
      failed.push({ slug: target.slug, error: formatted.message });
      logger.error("Failed to enrich glossary term", {
        module: LOG_MODULES.API.ADMIN_GLOSSARY_BACKFILL,
        slug: target.slug,
        ...formatted,
      });
    }
  }

  if (updatedUrls.length > 0) {
    try {
      await notifySearchEngines(updatedUrls);
    } catch (notifyError) {
      logger.warn("notifySearchEngines failed (non-fatal)", {
        module: LOG_MODULES.API.ADMIN_GLOSSARY_BACKFILL,
        ...formatError(notifyError),
      });
    }
  }

  logger.info("Glossary backfill completed", {
    module: LOG_MODULES.API.ADMIN_GLOSSARY_BACKFILL,
    updated: updatedUrls.length,
    failed: failed.length,
  });

  return NextResponse.json({
    ok: true,
    total: targets.length,
    updated: updatedUrls.length,
    failed,
  });
}
