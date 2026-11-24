import "server-only";
import { fetchSearchPerformance } from "@/shared/api/google-apis/search-console";
import { fetchPagePerformance } from "@/shared/api/google-apis/analytics";
import {
  computeWeeklySummary,
  extractInsights,
  measureInsightEffectiveness,
} from "./analyzer";
import { normalizePagePath } from "./normalize-path";
import { isExcludedSeoPath } from "./excluded-paths";
import { sendSeoReportToSlack } from "@/shared/api/slack/send-seo-report";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

function getDateRange(weeksAgo: number): { start: string; end: string } {
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const end = new Date(jstNow);
  end.setDate(end.getDate() - 7 * weeksAgo);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export type CollectSeoDataResult = {
  searchRows: number;
  pageRows: number;
  insightsCount: number;
  followupCount: number;
  summary: {
    totalClicks: number;
    totalImpressions: number;
    avgCtr: number;
    avgPosition: number;
  };
};

export async function collectSeoData(): Promise<CollectSeoDataResult> {
  const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
  const ga4PropertyId = process.env.GA4_PROPERTY_ID;

  if (!siteUrl) {
    throw new Error("SEARCH_CONSOLE_SITE_URL is not configured");
  }
  if (!ga4PropertyId) {
    throw new Error("GA4_PROPERTY_ID is not configured");
  }

  const currentRange = getDateRange(0);
  const previousRange = getDateRange(1);
  const collectedAt = new Date(new Date().getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  logger.info("Starting SEO data collection", {
    module: LOG_MODULES.API.CRON_SEO_DATA,
    currentRange,
    previousRange,
    collectedAt,
  });

  const [currentSearchRows, previousSearchRows, pageRows] = await Promise.all([
    fetchSearchPerformance(siteUrl, currentRange.start, currentRange.end),
    fetchSearchPerformance(siteUrl, previousRange.start, previousRange.end),
    fetchPagePerformance(ga4PropertyId, currentRange.start, currentRange.end),
  ]);

  const visiblePageRows = pageRows.filter(
    (row) => !isExcludedSeoPath(row.pagePath),
  );

  logger.info("API data fetched", {
    module: LOG_MODULES.API.CRON_SEO_DATA,
    currentSearchRows: currentSearchRows.length,
    previousSearchRows: previousSearchRows.length,
    pageRows: pageRows.length,
    visiblePageRows: visiblePageRows.length,
  });

  const supabase = createAdminClient();

  if (currentSearchRows.length > 0) {
    const searchRecords = currentSearchRows.map((row) => ({
      collected_at: collectedAt,
      date_range_start: currentRange.start,
      date_range_end: currentRange.end,
      query: row.query,
      page: normalizePagePath(row.page, siteUrl),
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

    const { error } = await supabase
      .from("seo_search_performance")
      .upsert(searchRecords, { onConflict: "collected_at,query,page" });

    if (error) {
      logger.error("Failed to save search performance", {
        module: LOG_MODULES.API.CRON_SEO_DATA,
        error: error.message,
      });
      throw error;
    }
  }

  if (visiblePageRows.length > 0) {
    const pageRecords = visiblePageRows.map((row) => ({
      collected_at: collectedAt,
      date_range_start: currentRange.start,
      date_range_end: currentRange.end,
      page_path: row.pagePath,
      page_views: row.pageViews,
      unique_users: row.uniqueUsers,
      avg_engagement_time: row.avgEngagementTime,
      bounce_rate: row.bounceRate,
    }));

    const { error } = await supabase
      .from("seo_page_performance")
      .upsert(pageRecords, { onConflict: "collected_at,page_path" });

    if (error) {
      logger.error("Failed to save page performance", {
        module: LOG_MODULES.API.CRON_SEO_DATA,
        error: error.message,
      });
      throw error;
    }
  }

  const summary = computeWeeklySummary(currentSearchRows, previousSearchRows);
  const insights = extractInsights(currentSearchRows);

  if (insights.length > 0) {
    const insightRecords = insights.map((insight) => ({
      collected_at: collectedAt,
      insight_type: insight.insightType,
      priority: Math.round(insight.priority),
      title: insight.title,
      description: insight.description,
      target_query: insight.targetQuery,
      target_page: insight.targetPage,
      current_metrics: insight.currentMetrics,
      suggested_action: insight.suggestedAction,
      status: "new" as const,
    }));

    const { error } = await supabase
      .from("seo_insights")
      .insert(insightRecords);

    if (error) {
      logger.error("Failed to save insights", {
        module: LOG_MODULES.API.CRON_SEO_DATA,
        error: error.message,
      });
      throw error;
    }
  }

  logger.info("SEO data saved to database", {
    module: LOG_MODULES.API.CRON_SEO_DATA,
    searchRows: currentSearchRows.length,
    pageRows: visiblePageRows.length,
    insights: insights.length,
  });

  const followupResults = await measureInsightEffectiveness(supabase);

  logger.info("Insight followup completed", {
    module: LOG_MODULES.API.CRON_SEO_DATA,
    followupCount: followupResults.length,
  });

  await sendSeoReportToSlack(summary, insights, followupResults);

  return {
    searchRows: currentSearchRows.length,
    pageRows: visiblePageRows.length,
    insightsCount: insights.length,
    followupCount: followupResults.length,
    summary: {
      totalClicks: summary.totalClicks,
      totalImpressions: summary.totalImpressions,
      avgCtr: summary.avgCtr,
      avgPosition: summary.avgPosition,
    },
  };
}
