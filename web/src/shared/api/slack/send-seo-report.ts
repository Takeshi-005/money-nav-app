import "server-only";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import type {
  SeoInsight,
  WeeklySummary,
  InsightFollowupResult,
} from "@/shared/api/seo/types";

function formatDelta(current: number, previous: number | null): string {
  if (previous === null) {
    return "";
  }
  const diff = current - previous;
  const sign = diff >= 0 ? "+" : "";
  return ` (${sign}${diff.toFixed(1)})`;
}

function formatPercentDelta(current: number, previous: number | null): string {
  if (previous === null) {
    return "";
  }
  const diff = (current - previous) * 100;
  const sign = diff >= 0 ? "+" : "";
  return ` (${sign}${diff.toFixed(2)}pp)`;
}

const INSIGHT_LABELS: Record<string, string> = {
  low_ctr: "🔍 高インプレッション低CTR",
  position_improvement: "📈 順位改善候補",
  content_gap: "📝 コンテンツギャップ",
  top_performer: "🏆 トップパフォーマー",
};

export async function sendSeoReportToSlack(
  summary: WeeklySummary,
  insights: SeoInsight[],
  followupResults: InsightFollowupResult[] = [],
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("SLACK_WEBHOOK_URL not configured, skipping SEO report", {
      module: LOG_MODULES.LIB.SLACK,
    });
    return;
  }

  const lines: string[] = [
    "📊 *週次SEOレポート*",
    "",
    "*サマリー*",
    `• クリック数: ${summary.totalClicks.toLocaleString()}${formatDelta(summary.totalClicks, summary.prevTotalClicks)}`,
    `• 表示回数: ${summary.totalImpressions.toLocaleString()}${formatDelta(summary.totalImpressions, summary.prevTotalImpressions)}`,
    `• 平均CTR: ${(summary.avgCtr * 100).toFixed(2)}%${formatPercentDelta(summary.avgCtr, summary.prevAvgCtr)}`,
    `• 平均掲載順位: ${summary.avgPosition.toFixed(1)}${formatDelta(summary.avgPosition, summary.prevAvgPosition)}`,
  ];

  const groupedInsights = new Map<string, SeoInsight[]>();
  for (const insight of insights) {
    const group = groupedInsights.get(insight.insightType) ?? [];
    group.push(insight);
    groupedInsights.set(insight.insightType, group);
  }

  for (const [type, items] of groupedInsights) {
    const label = INSIGHT_LABELS[type] ?? type;
    lines.push("", `*${label}* (${items.length}件)`);
    for (const item of items.slice(0, 3)) {
      const metrics = item.currentMetrics;
      lines.push(
        `  • ${item.title}`,
        `    imp:${metrics.impressions} click:${metrics.clicks} CTR:${(metrics.ctr * 100).toFixed(1)}% pos:${metrics.position.toFixed(1)}`,
        `    → ${item.suggestedAction}`,
      );
    }
    if (items.length > 3) {
      lines.push(`  ... 他${items.length - 3}件`);
    }
  }

  if (followupResults.length > 0) {
    lines.push("", "*📋 施策効果レポート*");
    for (const result of followupResults) {
      const icon = result.improvementSummary.includes("改善") ? "✅" : "⚠️";
      const query = result.targetQuery ?? result.targetPage ?? "不明";
      lines.push(
        `  ${icon} [${query}] ${result.actionTaken} → ${result.improvementSummary}`,
      );
    }
  }

  lines.push(
    "",
    `⏰ ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
  );

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });

    if (!response.ok) {
      logger.error("Failed to send SEO report to Slack", {
        module: LOG_MODULES.LIB.SLACK,
        status: response.status,
      });
    }
  } catch (error) {
    logger.error("Slack SEO report notification failed", {
      module: LOG_MODULES.LIB.SLACK,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
