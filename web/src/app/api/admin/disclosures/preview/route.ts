import { NextResponse } from "next/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { checkAdmin } from "@/shared/lib/auth";
import {
  classifyEvents,
  parseAnalyzedPayload,
  summarizeEvents,
} from "@/shared/api/disclosure-import/parse-payload";
import {
  pickTopByLearningValue,
  TOP_N_PER_IMPORT,
} from "@/shared/api/disclosure-import/score-importance";

interface PreviewRequestBody {
  analyzedJson?: string;
}

export async function POST(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: PreviewRequestBody;
  try {
    body = (await request.json()) as PreviewRequestBody;
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
      {
        valid: false,
        error: parsed.error.message,
        details: parsed.error.details,
      },
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

  const { data: watchedRows } = await supabase
    .from("watched_stocks")
    .select("ticker_code, is_active");

  const watchedSet = new Set(
    (watchedRows ?? [])
      .filter((s) => s.is_active)
      .map((s) => s.ticker_code.toUpperCase()),
  );

  const topEvents = pickTopByLearningValue(payload.events, TOP_N_PER_IMPORT);
  const classification = classifyEvents(topEvents, watchedSet);
  const distribution = summarizeEvents(topEvents);

  return NextResponse.json({
    valid: true,
    duplicate: existing
      ? { existingImportId: existing.id, importedAt: existing.created_at }
      : null,
    payload: {
      articleDate: payload.articleDate,
      sourceUrl: payload.sourceUrl ?? null,
    },
    summary: {
      totalEvents: topEvents.length,
      droppedCount: payload.events.length - topEvents.length,
      watchedCount: classification.watched.length,
      unwatchedCount: classification.unwatched.length,
      distribution,
    },
    events: topEvents.map((e) => ({
      ...e,
      isWatched: watchedSet.has(e.tickerCode),
    })),
  });
}
