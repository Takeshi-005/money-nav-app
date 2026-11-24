import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import {
  listKnownPages,
  type KnownPage,
  type KnownPageKind,
} from "./known-pages";

export type PageClassification =
  | "title_mismatch"
  | "query_unacquired"
  | "no_demand"
  | "healthy";

export interface PageQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PageAuditRow {
  pagePath: string;
  kind: KnownPageKind;
  editable: boolean;
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number | null;
  uniqueQueryCount: number;
  topQueries: PageQueryRow[];
  classification: PageClassification;
  classificationReason: string;
}

/**
 * 低トラフィック向けに緩和した分類閾値。
 * Search Consoleの表示数が増えたら本番運用前に再調整すること。
 * （既存 INSIGHT_THRESHOLDS は表示≥20で動くが、現在はサイト全体で週13表示しかなく
 *  そのままでは title_mismatch がほぼ検出できないため別管理する）
 */
export const PAGE_AUDIT_THRESHOLDS = {
  TITLE_MISMATCH_MIN_IMPRESSIONS: 5,
  TITLE_MISMATCH_MAX_CTR: 0.03,
  TITLE_MISMATCH_MAX_POSITION: 15,
  NO_DEMAND_MAX_IMPRESSIONS: 3,
  HEALTHY_MIN_CLICKS: 1,
  TOP_QUERIES_LIMIT: 5,
  LOOKBACK_WEEKS: 4,
} as const;

interface AggregatedQuery {
  query: string;
  clicks: number;
  impressions: number;
  positionSum: number;
  positionCount: number;
}

interface RawSearchRow {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}

export function classifyPage(
  totalImpressions: number,
  totalClicks: number,
  avgCtr: number,
  topQueries: PageQueryRow[],
): { classification: PageClassification; reason: string } {
  if (totalClicks >= PAGE_AUDIT_THRESHOLDS.HEALTHY_MIN_CLICKS) {
    return {
      classification: "healthy",
      reason: `クリック ${totalClicks}回獲得済み・維持対象`,
    };
  }

  const titleMismatchQuery = topQueries.find(
    (q) =>
      q.impressions >= PAGE_AUDIT_THRESHOLDS.TITLE_MISMATCH_MIN_IMPRESSIONS &&
      q.ctr < PAGE_AUDIT_THRESHOLDS.TITLE_MISMATCH_MAX_CTR &&
      q.position <= PAGE_AUDIT_THRESHOLDS.TITLE_MISMATCH_MAX_POSITION,
  );
  if (titleMismatchQuery) {
    return {
      classification: "title_mismatch",
      reason: `「${titleMismatchQuery.query}」で${titleMismatchQuery.impressions}回表示・順位${titleMismatchQuery.position.toFixed(1)}位だがCTR ${(titleMismatchQuery.ctr * 100).toFixed(1)}%`,
    };
  }

  if (topQueries.length === 0) {
    return {
      classification: "query_unacquired",
      reason:
        "Search Consoleにクエリ行なし（インデックスはされているがクエリ獲得ゼロ）",
    };
  }

  if (totalImpressions <= PAGE_AUDIT_THRESHOLDS.NO_DEMAND_MAX_IMPRESSIONS) {
    return {
      classification: "no_demand",
      reason: `直近${PAGE_AUDIT_THRESHOLDS.LOOKBACK_WEEKS}週で表示${totalImpressions}回のみ・検索需要が極小`,
    };
  }

  return {
    classification: "no_demand",
    reason: `表示${totalImpressions}回・クリック0回・需要が弱い`,
  };
}

function aggregateQueries(rows: RawSearchRow[]): AggregatedQuery[] {
  const map = new Map<string, AggregatedQuery>();
  for (const row of rows) {
    const existing = map.get(row.query);
    if (existing) {
      existing.clicks += row.clicks;
      existing.impressions += row.impressions;
      existing.positionSum += row.position * row.impressions;
      existing.positionCount += row.impressions;
    } else {
      map.set(row.query, {
        query: row.query,
        clicks: row.clicks,
        impressions: row.impressions,
        positionSum: row.position * row.impressions,
        positionCount: row.impressions,
      });
    }
  }
  return Array.from(map.values());
}

function getCutoffDate(weeks: number): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  return cutoff.toISOString().split("T")[0];
}

async function fetchSearchRowsForPage(
  supabase: SupabaseClient<Database>,
  pagePath: string,
  cutoffDate: string,
): Promise<RawSearchRow[]> {
  const { data } = await supabase
    .from("seo_search_performance")
    .select("query, clicks, impressions, position")
    .gte("collected_at", cutoffDate)
    .eq("page", pagePath);
  return (data ?? []).map((r) => ({
    query: r.query,
    clicks: r.clicks,
    impressions: r.impressions,
    position: r.position,
  }));
}

function buildPageAuditRow(
  page: KnownPage,
  rows: RawSearchRow[],
): PageAuditRow {
  const aggregated = aggregateQueries(rows);

  const totalClicks = aggregated.reduce((sum, q) => sum + q.clicks, 0);
  const totalImpressions = aggregated.reduce(
    (sum, q) => sum + q.impressions,
    0,
  );
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

  const allQueries: PageQueryRow[] = aggregated.map((q) => ({
    query: q.query,
    clicks: q.clicks,
    impressions: q.impressions,
    ctr: q.impressions > 0 ? q.clicks / q.impressions : 0,
    position: q.positionCount > 0 ? q.positionSum / q.positionCount : 0,
  }));

  const topQueries = [...allQueries]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, PAGE_AUDIT_THRESHOLDS.TOP_QUERIES_LIMIT);

  const totalPositionSum = aggregated.reduce(
    (sum, q) => sum + q.positionSum,
    0,
  );
  const totalPositionCount = aggregated.reduce(
    (sum, q) => sum + q.positionCount,
    0,
  );
  const avgPosition =
    totalPositionCount > 0 ? totalPositionSum / totalPositionCount : null;

  const { classification, reason } = classifyPage(
    totalImpressions,
    totalClicks,
    avgCtr,
    topQueries,
  );

  return {
    pagePath: page.path,
    kind: page.kind,
    editable: page.editable,
    totalClicks,
    totalImpressions,
    avgCtr,
    avgPosition,
    uniqueQueryCount: aggregated.length,
    topQueries,
    classification,
    classificationReason: reason,
  };
}

export async function fetchPageAuditList(
  supabase: SupabaseClient<Database>,
  options?: { weeks?: number },
): Promise<PageAuditRow[]> {
  const weeks = options?.weeks ?? PAGE_AUDIT_THRESHOLDS.LOOKBACK_WEEKS;
  const cutoffDate = getCutoffDate(weeks);
  const pages = await listKnownPages(supabase);

  const { data: allRows, error } = await supabase
    .from("seo_search_performance")
    .select("page, query, clicks, impressions, position")
    .gte("collected_at", cutoffDate);
  if (error) {
    throw error;
  }

  const rowsByPage = new Map<string, RawSearchRow[]>();
  for (const row of allRows ?? []) {
    const list = rowsByPage.get(row.page) ?? [];
    list.push({
      query: row.query,
      clicks: row.clicks,
      impressions: row.impressions,
      position: row.position,
    });
    rowsByPage.set(row.page, list);
  }

  const rows = pages.map((page) =>
    buildPageAuditRow(page, rowsByPage.get(page.path) ?? []),
  );

  return rows.sort((a, b) => b.totalImpressions - a.totalImpressions);
}

export async function fetchPageAuditDetail(
  supabase: SupabaseClient<Database>,
  pagePath: string,
  options?: { weeks?: number },
): Promise<PageAuditRow | null> {
  const weeks = options?.weeks ?? PAGE_AUDIT_THRESHOLDS.LOOKBACK_WEEKS;
  const cutoffDate = getCutoffDate(weeks);
  const pages = await listKnownPages(supabase);
  const page = pages.find((p) => p.path === pagePath);
  if (!page) {
    return null;
  }
  const searchRows = await fetchSearchRowsForPage(
    supabase,
    pagePath,
    cutoffDate,
  );
  return buildPageAuditRow(page, searchRows);
}
