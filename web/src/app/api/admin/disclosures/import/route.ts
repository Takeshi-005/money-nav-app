import { NextResponse } from "next/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { checkAdmin } from "@/shared/lib/auth";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { parseAnalyzedPayload } from "@/shared/api/disclosure-import/parse-payload";
import {
  pickTopByLearningValue,
  TOP_N_PER_IMPORT,
} from "@/shared/api/disclosure-import/score-importance";
import { sendTomorrowImpactXDraftToSlack } from "@/shared/api/slack/send-tomorrow-impact-x-draft";

interface ImportRequestBody {
  analyzedJson?: string;
}

export async function POST(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: ImportRequestBody;
  try {
    body = (await request.json()) as ImportRequestBody;
  } catch {
    return NextResponse.json(
      { error: "リクエストボディが不正です" },
      { status: 400 },
    );
  }

  const analyzedJson = body.analyzedJson?.trim() ?? "";
  if (!analyzedJson) {
    return NextResponse.json(
      { error: "analyzedJson は必須です" },
      { status: 400 },
    );
  }

  const parsed = parseAnalyzedPayload(analyzedJson);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error.message, details: parsed.error.details },
      { status: 400 },
    );
  }

  const { payload, textHash } = parsed.data;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("disclosure_imports")
    .select("id, created_at")
    .eq("text_hash", textHash)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: "同じ内容のJSONが既に取り込まれています",
        existingImportId: existing.id,
        importedAt: existing.created_at,
      },
      { status: 409 },
    );
  }

  const { data: imported, error: insertError } = await supabase
    .from("disclosure_imports")
    .insert({
      source: "kabutan_manual",
      source_url: payload.sourceUrl ?? null,
      article_date: payload.articleDate,
      raw_json: analyzedJson,
      text_hash: textHash,
      imported_by: admin.id,
    })
    .select("id")
    .single();

  if (insertError || !imported) {
    logger.error("Failed to insert disclosure_imports", {
      module: LOG_MODULES.API.ADMIN_DISCLOSURES_IMPORT,
      error: insertError?.message,
    });
    return NextResponse.json(
      { error: "取り込み記録の作成に失敗しました" },
      { status: 500 },
    );
  }

  const importId = imported.id;
  const topEvents = pickTopByLearningValue(payload.events, TOP_N_PER_IMPORT);

  if (topEvents.length === 0) {
    return NextResponse.json({
      importId,
      savedEventsCount: 0,
      savedAnalysesCount: 0,
      watchedCount: 0,
      unwatchedCount: 0,
    });
  }

  const eventRows = topEvents.map((e) => ({
    disclosure_import_id: importId,
    ticker_code: e.tickerCode,
    company_name: e.companyName,
    disclosure_type: e.disclosureType,
  }));

  const { data: insertedEvents, error: eventsError } = await supabase
    .from("disclosure_events")
    .insert(eventRows)
    .select("id, ticker_code");

  if (eventsError || !insertedEvents) {
    logger.error("Failed to insert disclosure_events", {
      module: LOG_MODULES.API.ADMIN_DISCLOSURES_IMPORT,
      importId,
      error: eventsError?.message,
    });
    return NextResponse.json(
      {
        importId,
        error: "開示イベントの保存に失敗しました",
      },
      { status: 500 },
    );
  }

  const eventIdByTicker = new Map<string, string>();
  for (const row of insertedEvents) {
    eventIdByTicker.set(row.ticker_code, row.id);
  }

  const { data: watchedRows } = await supabase
    .from("watched_stocks")
    .select("ticker_code, is_active");
  const watchedSet = new Set(
    (watchedRows ?? [])
      .filter((s) => s.is_active)
      .map((s) => s.ticker_code.toUpperCase()),
  );

  const analysisRows = topEvents.map((e) => ({
    date: payload.articleDate,
    ticker_code: e.tickerCode,
    impact: e.impact,
    magnitude: e.magnitude,
    reason: e.reason,
    educational_note: e.educationalNote,
    relevance_score: e.relevanceScore,
    key_concept: e.keyConcept,
    social_summary: e.socialSummary,
    source: "disclosure",
    disclosure_event_id: eventIdByTicker.get(e.tickerCode) ?? null,
  }));

  const { error: analysisError, count: analysisCount } = await supabase
    .from("stock_impact_analyses")
    .upsert(analysisRows, {
      onConflict: "date,ticker_code,source",
      count: "exact",
    });

  if (analysisError) {
    logger.error("Failed to upsert stock_impact_analyses", {
      module: LOG_MODULES.API.ADMIN_DISCLOSURES_IMPORT,
      importId,
      error: analysisError.message,
    });
    return NextResponse.json(
      {
        importId,
        savedEventsCount: insertedEvents.length,
        error: "判定の保存に失敗しました",
      },
      { status: 500 },
    );
  }

  const watchedCount = topEvents.filter((e) =>
    watchedSet.has(e.tickerCode),
  ).length;
  const unwatchedCount = topEvents.length - watchedCount;

  const positiveCount = topEvents.filter((e) => e.impact === "positive").length;
  const negativeCount = topEvents.filter((e) => e.impact === "negative").length;
  const topKeyConcepts = topEvents.slice(0, 3).map((e) => e.keyConcept);

  void sendTomorrowImpactXDraftToSlack({
    articleDate: payload.articleDate,
    positiveCount,
    negativeCount,
    topKeyConcepts,
    topSocialSummary: topEvents[0]?.socialSummary,
  }).catch(() => {});

  return NextResponse.json({
    importId,
    savedEventsCount: insertedEvents.length,
    savedAnalysesCount: analysisCount ?? analysisRows.length,
    droppedCount: payload.events.length - topEvents.length,
    watchedCount,
    unwatchedCount,
  });
}
