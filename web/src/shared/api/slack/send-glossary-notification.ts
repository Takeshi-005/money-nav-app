import "server-only";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

export async function sendGlossaryNotificationToSlack(
  terms: { term: string; slug: string }[],
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("SLACK_WEBHOOK_URL not configured, skipping notification", {
      module: LOG_MODULES.LIB.SLACK,
    });
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://money-nav.com";
  const termList = terms.map((t) => `• <${appUrl}/glossary/${t.slug}|${t.term}>`).join("\n");

  const lines = [
    `📖 用語辞典が更新されました（+${terms.length}語）`,
    "",
    "追加された用語:",
    termList,
  ];

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: lines.join("\n") }),
  });

  if (!response.ok) {
    throw new Error(
      `Slack API error: ${response.status} ${response.statusText}`,
    );
  }
}
