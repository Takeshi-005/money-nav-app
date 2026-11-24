import "server-only";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

export type PredictionSkipReason =
  | "already_exists"
  | "no_news"
  | "insert_failed";

const REASON_LABELS: Record<PredictionSkipReason, string> = {
  already_exists: "既に当日の予測問題が存在",
  no_news: "ニュース 0 件（Google News）",
  insert_failed: "DB 書き込み失敗",
};

const SEVERITY_PREFIX: Record<PredictionSkipReason, string> = {
  already_exists: "ℹ️",
  no_news: "⚠️",
  insert_failed: "🚨",
};

export async function sendPredictionSkipToSlack(
  date: string,
  reason: PredictionSkipReason,
  detail?: string,
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn(
      "SLACK_WEBHOOK_URL not configured, skipping prediction skip notification",
      { module: LOG_MODULES.LIB.SLACK },
    );
    return;
  }

  if (reason === "already_exists") {
    return;
  }

  const lines = [
    `${SEVERITY_PREFIX[reason]} *予測トレーニング生成スキップ*`,
    "",
    `*日付:* ${date}`,
    `*理由:* ${REASON_LABELS[reason]}`,
  ];

  if (detail) {
    lines.push("", `*詳細:*\n\`\`\`${detail}\`\`\``);
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
      logger.error("Failed to send prediction skip notification to Slack", {
        module: LOG_MODULES.LIB.SLACK,
        status: response.status,
      });
    }
  } catch (error) {
    logger.error("Slack prediction skip notification failed", {
      module: LOG_MODULES.LIB.SLACK,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
