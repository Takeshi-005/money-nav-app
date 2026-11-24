import type {
  SearchPerformanceRow,
  SeoInsight,
  InsightMetrics,
  InsightFollowupResult,
  WeeklySummary,
} from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// 低トラフィックフェーズ向けの閾値。表示数が伸びたら引き上げる。
export const INSIGHT_THRESHOLDS = {
  LOW_CTR_MIN_IMPRESSIONS: 20,
  LOW_CTR_MAX_CTR: 0.03,
  LOW_CTR_MAX_POSITION: 10,
  POSITION_IMPROVEMENT_MIN_IMPRESSIONS: 10,
  POSITION_IMPROVEMENT_MIN: 11,
  POSITION_IMPROVEMENT_MAX: 25,
  CONTENT_GAP_MIN_IMPRESSIONS: 20,
  CONTENT_GAP_MIN_POSITION: 30,
  TOP_PERFORMER_MIN_CTR: 0.08,
  TOP_PERFORMER_MIN_CLICKS: 3,
} as const;

export function computeWeeklySummary(
  currentRows: SearchPerformanceRow[],
  previousRows: SearchPerformanceRow[] | null,
): WeeklySummary {
  const totalClicks = currentRows.reduce((sum, r) => sum + r.clicks, 0);
  const totalImpressions = currentRows.reduce(
    (sum, r) => sum + r.impressions,
    0,
  );
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgPosition =
    currentRows.length > 0
      ? currentRows.reduce((sum, r) => sum + r.position, 0) / currentRows.length
      : 0;

  let prevTotalClicks: number | null = null;
  let prevTotalImpressions: number | null = null;
  let prevAvgCtr: number | null = null;
  let prevAvgPosition: number | null = null;

  if (previousRows && previousRows.length > 0) {
    prevTotalClicks = previousRows.reduce((sum, r) => sum + r.clicks, 0);
    prevTotalImpressions = previousRows.reduce(
      (sum, r) => sum + r.impressions,
      0,
    );
    prevAvgCtr =
      prevTotalImpressions > 0 ? prevTotalClicks / prevTotalImpressions : 0;
    prevAvgPosition =
      previousRows.reduce((sum, r) => sum + r.position, 0) /
      previousRows.length;
  }

  return {
    totalClicks,
    totalImpressions,
    avgCtr,
    avgPosition,
    prevTotalClicks,
    prevTotalImpressions,
    prevAvgCtr,
    prevAvgPosition,
  };
}

export function extractInsights(rows: SearchPerformanceRow[]): SeoInsight[] {
  const insights: SeoInsight[] = [];

  for (const row of rows) {
    const metrics = {
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    };

    if (
      row.impressions >= INSIGHT_THRESHOLDS.LOW_CTR_MIN_IMPRESSIONS &&
      row.ctr < INSIGHT_THRESHOLDS.LOW_CTR_MAX_CTR &&
      row.position <= INSIGHT_THRESHOLDS.LOW_CTR_MAX_POSITION
    ) {
      insights.push({
        insightType: "low_ctr",
        priority: row.impressions * (INSIGHT_THRESHOLDS.LOW_CTR_MAX_CTR - row.ctr),
        title: `[${row.query}] 高インプレッション低CTR`,
        description: `表示回数 ${row.impressions}回に対しCTR ${(row.ctr * 100).toFixed(1)}%（順位${row.position.toFixed(1)}位）`,
        targetQuery: row.query,
        targetPage: row.page,
        currentMetrics: metrics,
        suggestedAction: "タイトル・メタディスクリプションの改善を検討",
      });
    }

    if (
      row.position >= INSIGHT_THRESHOLDS.POSITION_IMPROVEMENT_MIN &&
      row.position <= INSIGHT_THRESHOLDS.POSITION_IMPROVEMENT_MAX &&
      row.impressions >= INSIGHT_THRESHOLDS.POSITION_IMPROVEMENT_MIN_IMPRESSIONS
    ) {
      insights.push({
        insightType: "position_improvement",
        priority: row.impressions * (1 / row.position),
        title: `[${row.query}] 順位改善候補`,
        description: `順位${row.position.toFixed(1)}位で表示${row.impressions}回 - 1ページ目まであと少し`,
        targetQuery: row.query,
        targetPage: row.page,
        currentMetrics: metrics,
        suggestedAction: "既存記事の内容強化・内部リンク追加を検討",
      });
    }

    if (
      row.impressions >= INSIGHT_THRESHOLDS.CONTENT_GAP_MIN_IMPRESSIONS &&
      row.position > INSIGHT_THRESHOLDS.CONTENT_GAP_MIN_POSITION
    ) {
      insights.push({
        insightType: "content_gap",
        priority: row.impressions,
        title: `[${row.query}] コンテンツギャップ`,
        description: `検索需要あり（表示${row.impressions}回）だが順位${row.position.toFixed(1)}位と低い`,
        targetQuery: row.query,
        targetPage: row.page,
        currentMetrics: metrics,
        suggestedAction: "新規記事の作成候補",
      });
    }

    if (
      row.ctr >= INSIGHT_THRESHOLDS.TOP_PERFORMER_MIN_CTR &&
      row.clicks >= INSIGHT_THRESHOLDS.TOP_PERFORMER_MIN_CLICKS
    ) {
      insights.push({
        insightType: "top_performer",
        priority: row.clicks * row.ctr,
        title: `[${row.query}] トップパフォーマー`,
        description: `CTR ${(row.ctr * 100).toFixed(1)}%・クリック${row.clicks}回の高パフォーマンスクエリ`,
        targetQuery: row.query,
        targetPage: row.page,
        currentMetrics: metrics,
        suggestedAction: "成功パターンとして記録・横展開を検討",
      });
    }
  }

  return insights.sort((a, b) => b.priority - a.priority);
}

const FOLLOWUP_DELAY_DAYS = 14;

export async function measureInsightEffectiveness(
  supabase: SupabaseClient<Database>,
): Promise<InsightFollowupResult[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - FOLLOWUP_DELAY_DAYS);

  const { data: completedInsights, error } = await supabase
    .from("seo_insights")
    .select("*")
    .eq("status", "completed")
    .not("action_completed_at", "is", null)
    .is("followup_at", null)
    .lte("action_completed_at", cutoffDate.toISOString());

  if (error) {
    throw error;
  }
  if (!completedInsights || completedInsights.length === 0) {
    return [];
  }

  const results: InsightFollowupResult[] = [];

  for (const insight of completedInsights) {
    const baseline = (insight.baseline_metrics ??
      insight.current_metrics) as InsightMetrics | null;
    if (!baseline) {
      continue;
    }

    const latestMetrics = await fetchLatestMetricsForInsight(
      supabase,
      insight.target_query,
      insight.target_page,
    );
    if (!latestMetrics) {
      continue;
    }

    const summary = generateImprovementSummary(
      baseline,
      latestMetrics,
      insight.insight_type,
    );

    const today = new Date().toISOString().split("T")[0];

    await supabase
      .from("seo_insights")
      .update({
        followup_metrics:
          latestMetrics as unknown as Database["public"]["Tables"]["seo_insights"]["Update"]["followup_metrics"],
        followup_at: today,
        improvement_summary: summary,
      })
      .eq("id", insight.id);

    results.push({
      insightId: insight.id,
      targetQuery: insight.target_query,
      targetPage: insight.target_page,
      actionTaken: insight.action_taken ?? "",
      baselineMetrics: baseline,
      followupMetrics: latestMetrics,
      improvementSummary: summary,
    });
  }

  return results;
}

async function fetchLatestMetricsForInsight(
  supabase: SupabaseClient<Database>,
  targetQuery: string | null,
  targetPage: string | null,
): Promise<InsightMetrics | null> {
  if (!targetQuery && !targetPage) {
    return null;
  }

  let query = supabase
    .from("seo_search_performance")
    .select("clicks, impressions, ctr, position")
    .order("collected_at", { ascending: false })
    .limit(1);

  if (targetQuery) {
    query = query.eq("query", targetQuery);
  }
  if (targetPage) {
    query = query.eq("page", targetPage);
  }

  const { data } = await query.single();
  if (!data) {
    return null;
  }

  return {
    clicks: data.clicks,
    impressions: data.impressions,
    ctr: data.ctr,
    position: data.position,
  };
}

function generateImprovementSummary(
  baseline: InsightMetrics,
  followup: InsightMetrics,
  insightType: string,
): string {
  const formatCtr = (v: number) => `${(v * 100).toFixed(1)}%`;
  const formatPos = (v: number) => v.toFixed(1);
  const pctChange = (before: number, after: number) =>
    before === 0 ? (after > 0 ? "+∞" : "±0") : `${after >= before ? "+" : ""}${(((after - before) / before) * 100).toFixed(0)}%`;

  const posDiff = baseline.position - followup.position;
  const posImproved = posDiff > 0;

  switch (insightType) {
    case "low_ctr": {
      const ctrImproved = followup.ctr > baseline.ctr;
      const main = `CTR ${formatCtr(baseline.ctr)} → ${formatCtr(followup.ctr)} (${pctChange(baseline.ctr, followup.ctr)})`;
      const sub = `クリック数: ${baseline.clicks} → ${followup.clicks}`;
      return ctrImproved
        ? `${main} 改善 / ${sub}`
        : `${main} 低下 / ${sub}`;
    }
    case "position_improvement": {
      const main = `順位 ${formatPos(baseline.position)} → ${formatPos(followup.position)} (${Math.abs(posDiff).toFixed(1)}位${posImproved ? "上昇" : "下降"})`;
      const sub = `CTR: ${formatCtr(baseline.ctr)} → ${formatCtr(followup.ctr)}`;
      return posImproved
        ? `${main} 改善 / ${sub}`
        : `${main} 悪化 / ${sub}`;
    }
    case "content_gap": {
      const posMain = `順位 ${formatPos(baseline.position)} → ${formatPos(followup.position)}`;
      const impMain = `表示 ${baseline.impressions} → ${followup.impressions} (${pctChange(baseline.impressions, followup.impressions)})`;
      const improved = posImproved || followup.impressions > baseline.impressions;
      return improved
        ? `${posMain} / ${impMain} 改善`
        : `${posMain} / ${impMain} 変化なし`;
    }
    case "top_performer": {
      const clicksUp = followup.clicks >= baseline.clicks;
      const main = `クリック ${baseline.clicks} → ${followup.clicks} (${pctChange(baseline.clicks, followup.clicks)})`;
      const sub = `CTR: ${formatCtr(baseline.ctr)} → ${formatCtr(followup.ctr)}`;
      return clicksUp
        ? `${main} 改善維持 / ${sub}`
        : `${main} 低下 / ${sub}`;
    }
    default: {
      const main = `クリック ${baseline.clicks} → ${followup.clicks}`;
      const sub = `順位 ${formatPos(baseline.position)} → ${formatPos(followup.position)}`;
      return `${main} / ${sub}`;
    }
  }
}
