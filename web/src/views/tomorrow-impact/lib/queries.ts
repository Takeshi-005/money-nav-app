import "server-only";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { findGlossaryTermLinks } from "@/entities/glossary-term";
import type { DisclosureImpactAnalysis } from "@/features/disclosure-impact-data";
import type { DisclosureType } from "@/shared/api/gemini/disclosure-extraction";

const DATE_TAB_LIMIT = 14;

const IMPACT_SELECT = `
  ticker_code,
  impact,
  magnitude,
  reason,
  educational_note,
  relevance_score,
  key_concept,
  created_at,
  disclosure_events!inner (
    company_name,
    disclosure_type
  )
`;

interface JoinedRow {
  ticker_code: string;
  impact: string;
  magnitude: string;
  reason: string;
  educational_note: string | null;
  relevance_score: number | null;
  key_concept: string | null;
  created_at: string | null;
  disclosure_events: {
    company_name: string;
    disclosure_type: string;
  };
}

function mapJoinedRow(row: JoinedRow): DisclosureImpactAnalysis {
  return {
    ticker_code: row.ticker_code,
    company_name: row.disclosure_events.company_name,
    disclosure_type: row.disclosure_events.disclosure_type as DisclosureType,
    impact: row.impact as DisclosureImpactAnalysis["impact"],
    magnitude: row.magnitude as DisclosureImpactAnalysis["magnitude"],
    reason: row.reason,
    educational_note: row.educational_note,
    relevance_score: row.relevance_score,
    key_concept: row.key_concept,
  };
}

export interface ImpactStocksResult {
  stocks: DisclosureImpactAnalysis[];
  latestCreatedAt: string | null;
}

export interface DateTickerPair {
  date: string;
  ticker: string;
}

export interface GlossaryLink {
  slug: string;
  term: string;
}

export async function getAvailableDates(
  limit: number = DATE_TAB_LIMIT,
): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("disclosure_imports")
    .select("article_date")
    .order("article_date", { ascending: false })
    .limit(30);
  const unique = Array.from(
    new Set((data ?? []).map((row) => row.article_date)),
  );
  return unique.slice(0, limit);
}

export async function getDatesWithImpactAnalyses(
  limit: number,
): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("stock_impact_analyses")
    .select("date")
    .eq("source", "disclosure")
    .order("date", { ascending: false })
    .limit(2000);
  const unique = Array.from(new Set((data ?? []).map((row) => row.date)));
  return unique.slice(0, limit);
}

/** generateStaticParams / sitemap 用に (日付, 銘柄) の組を新しい順で返す */
export async function getDateTickerPairs(
  limit: number,
): Promise<DateTickerPair[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("stock_impact_analyses")
    .select("date, ticker_code")
    .eq("source", "disclosure")
    .order("date", { ascending: false })
    .limit(2000);

  const seen = new Set<string>();
  const pairs: DateTickerPair[] = [];
  for (const row of (data ?? []) as { date: string; ticker_code: string }[]) {
    const key = `${row.date}__${row.ticker_code}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    pairs.push({ date: row.date, ticker: row.ticker_code });
    if (pairs.length >= limit) {
      break;
    }
  }
  return pairs;
}

export async function getImpactStocksByDate(
  date: string,
): Promise<ImpactStocksResult> {
  if (!date) {
    return { stocks: [], latestCreatedAt: null };
  }
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("stock_impact_analyses")
    .select(IMPACT_SELECT)
    .eq("date", date)
    .eq("source", "disclosure")
    .order("relevance_score", { ascending: false });

  const rows = (data ?? []) as unknown as JoinedRow[];
  const stocks = rows.map(mapJoinedRow);

  const latestCreatedAt = rows.reduce<string | null>((latest, row) => {
    if (!row.created_at) {
      return latest;
    }
    if (!latest || row.created_at > latest) {
      return row.created_at;
    }
    return latest;
  }, null);

  return { stocks, latestCreatedAt };
}

/** 日付×銘柄で開示イベント1件を取得（無ければ null） */
export async function getImpactEventByDateTicker(
  date: string,
  ticker: string,
): Promise<DisclosureImpactAnalysis | null> {
  if (!date || !ticker) {
    return null;
  }
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("stock_impact_analyses")
    .select(IMPACT_SELECT)
    .eq("date", date)
    .eq("ticker_code", ticker)
    .eq("source", "disclosure")
    .order("relevance_score", { ascending: false })
    .limit(1);

  const rows = (data ?? []) as unknown as JoinedRow[];
  return rows.length > 0 ? mapJoinedRow(rows[0]) : null;
}

/**
 * key_concept を既存の用語集と突合し、リンク可能なら {slug, term} を返す。
 * 完全一致を優先し、無ければ key_concept に含まれる最長の用語を採用する。
 */
export async function getGlossaryLinkForConcept(
  keyConcept: string | null,
): Promise<GlossaryLink | null> {
  if (!keyConcept) {
    return null;
  }
  const normalized = keyConcept.trim();
  if (!normalized) {
    return null;
  }
  const links = await findGlossaryTermLinks();

  const exact = links.find((link) => link.term === normalized);
  if (exact) {
    return exact;
  }

  const contained = links
    .filter((link) => link.term.length >= 2 && normalized.includes(link.term))
    .sort((a, b) => b.term.length - a.term.length);

  return contained[0] ?? null;
}
