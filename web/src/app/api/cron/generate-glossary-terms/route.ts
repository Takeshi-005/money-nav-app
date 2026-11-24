import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import {
  generateGlossaryTerms,
  type GeneratedGlossaryTerm,
} from "@/shared/api/gemini/glossary";
import { verifySchedulerToken } from "@/shared/lib/verify-scheduler-token";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { sendGlossaryNotificationToSlack } from "@/shared/api/slack/send-glossary-notification";
import { notifySearchEngines } from "@/shared/api/search-engines/notify";

export async function POST(request: NextRequest) {
  try {
    const isValid = await verifySchedulerToken(
      request.headers.get("authorization"),
    );
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("glossary_terms")
      .select("slug");

    if (fetchError) {
      throw fetchError;
    }

    const existingSlugs = (existing ?? []).map((t) => t.slug as string);

    const terms = await generateGlossaryTerms(existingSlugs);

    const { error: upsertError } = await supabase.from("glossary_terms").upsert(
      terms.map((t: GeneratedGlossaryTerm) => ({
        term: t.term,
        slug: t.slug,
        reading: t.reading,
        category: t.category,
        definition: t.definition,
        explanation: t.explanation,
        example: t.example ?? null,
        related_terms: t.related_terms ?? null,
        difficulty: t.difficulty,
      })),
      { onConflict: "slug" },
    );

    if (upsertError) {
      throw upsertError;
    }

    logger.info("Glossary terms generated", {
      module: LOG_MODULES.API.CRON_GLOSSARY,
      count: terms.length,
      newTerms: terms.map((t) => t.slug),
    });

    sendGlossaryNotificationToSlack(terms).catch(() => {});

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (baseUrl) {
      const urls = [
        `${baseUrl}/glossary`,
        ...terms.map((t) => `${baseUrl}/glossary/${t.slug}`),
      ];
      notifySearchEngines(urls).catch(() => {});
    }

    return NextResponse.json({
      message: "Glossary terms generated successfully",
      count: terms.length,
      terms: terms.map((t) => t.slug),
    });
  } catch (error) {
    logger.error("Glossary generation error", {
      module: LOG_MODULES.API.CRON_GLOSSARY,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "用語辞典の生成中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
