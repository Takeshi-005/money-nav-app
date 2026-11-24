import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { isValidDate, isNotFutureDate } from "@/entities/news-article";
import type {
  DisclosureImpactAnalysis,
  DisclosureImpactResponse,
} from "@/features/disclosure-impact-data";
import type { DisclosureType } from "@/shared/api/gemini/disclosure-extraction";

interface JoinedRow {
  ticker_code: string;
  impact: string;
  magnitude: string;
  reason: string;
  educational_note: string | null;
  relevance_score: number | null;
  key_concept: string | null;
  disclosure_events: {
    company_name: string;
    disclosure_type: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date || !isValidDate(date) || !isNotFutureDate(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("stock_impact_analyses")
      .select(
        `
        ticker_code,
        impact,
        magnitude,
        reason,
        educational_note,
        relevance_score,
        key_concept,
        disclosure_events!inner (
          company_name,
          disclosure_type
        )
      `,
      )
      .eq("date", date)
      .eq("source", "disclosure")
      .order("relevance_score", { ascending: false });

    if (error) {
      logger.error("Disclosure impact fetch error", {
        module: LOG_MODULES.API.DISCLOSURE_IMPACT,
        error: error.message,
        date,
      });
      return NextResponse.json(
        { error: "Failed to fetch disclosure impact" },
        { status: 500 },
      );
    }

    const rows = (data ?? []) as unknown as JoinedRow[];

    const stocks: DisclosureImpactAnalysis[] = rows.map((row) => ({
      ticker_code: row.ticker_code,
      company_name: row.disclosure_events.company_name,
      disclosure_type: row.disclosure_events.disclosure_type as DisclosureType,
      impact: row.impact as DisclosureImpactAnalysis["impact"],
      magnitude: row.magnitude as DisclosureImpactAnalysis["magnitude"],
      reason: row.reason,
      educational_note: row.educational_note,
      relevance_score: row.relevance_score,
      key_concept: row.key_concept,
    }));

    const response: DisclosureImpactResponse = { date, stocks };
    return NextResponse.json(response);
  } catch (error) {
    logger.error("Disclosure impact API error", {
      module: LOG_MODULES.API.DISCLOSURE_IMPACT,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
