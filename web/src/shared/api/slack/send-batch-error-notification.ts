import "server-only";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

export async function sendBatchErrorToSlack(
  batchName: string,
  errorMessage: string,
  details?: string,
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("SLACK_WEBHOOK_URL not configured, skipping error notification", {
      module: LOG_MODULES.LIB.SLACK,
    });
    return;
  }

  const lines = [
    `🚨 *バッチ処理エラー: ${batchName}*`,
    "",
    `*エラー:* ${errorMessage}`,
  ];

  if (details) {
    lines.push("", `*詳細:*\n\`\`\`${details}\`\`\``);
  }

  lines.push("", `⏰ ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });

    if (!response.ok) {
      logger.error("Failed to send batch error to Slack", {
        module: LOG_MODULES.LIB.SLACK,
        status: response.status,
      });
    }
  } catch (slackError) {
    logger.error("Slack notification failed", {
      module: LOG_MODULES.LIB.SLACK,
      error: slackError instanceof Error ? slackError.message : String(slackError),
    });
  }
}

export async function sendBatchSuccessToSlack(
  batchName: string,
  message: string,
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  const lines = [
    `✅ *${batchName} 完了*`,
    "",
    message,
    "",
    `⏰ ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
  ];

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });

    if (!response.ok) {
      logger.error("Failed to send batch success to Slack", {
        module: LOG_MODULES.LIB.SLACK,
        status: response.status,
      });
    }
  } catch {
    // success通知の失敗は無視
  }
}
