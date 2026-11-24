import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export interface DemandKeyword {
  query: string;
  impressions: number;
  clicks: number;
  avgPosition: number;
}

interface FetchDemandKeywordsOptions {
  weeks?: number;
  minImpressions?: number;
  limit?: number;
  pagePath?: string;
}

/**
 * Search Consoleの直近データから、実際に検索流入が見込めるキーワードを抽出する。
 * 新規記事プロンプトに渡してタイトル生成を実需要起点に変えるための入力。
 */
export async function fetchDemandKeywords(
  supabase: SupabaseClient<Database>,
  options: FetchDemandKeywordsOptions = {},
): Promise<DemandKeyword[]> {
  const weeks = options.weeks ?? 4;
  const minImpressions = options.minImpressions ?? 3;
  const limit = options.limit ?? 20;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  const cutoffDate = cutoff.toISOString().split("T")[0];

  let query = supabase
    .from("seo_search_performance")
    .select("query, clicks, impressions, position")
    .gte("collected_at", cutoffDate);
  if (options.pagePath) {
    query = query.eq("page", options.pagePath);
  }

  const { data } = await query;
  if (!data) {
    return [];
  }

  const aggregated = new Map<
    string,
    { clicks: number; impressions: number; positionSum: number; positionCount: number }
  >();

  for (const row of data) {
    const existing = aggregated.get(row.query);
    if (existing) {
      existing.clicks += row.clicks;
      existing.impressions += row.impressions;
      existing.positionSum += row.position * row.impressions;
      existing.positionCount += row.impressions;
    } else {
      aggregated.set(row.query, {
        clicks: row.clicks,
        impressions: row.impressions,
        positionSum: row.position * row.impressions,
        positionCount: row.impressions,
      });
    }
  }

  const keywords: DemandKeyword[] = Array.from(aggregated.entries())
    .map(([q, v]) => ({
      query: q,
      clicks: v.clicks,
      impressions: v.impressions,
      avgPosition:
        v.positionCount > 0 ? v.positionSum / v.positionCount : 0,
    }))
    .filter((k) => k.impressions >= minImpressions)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);

  return keywords;
}
