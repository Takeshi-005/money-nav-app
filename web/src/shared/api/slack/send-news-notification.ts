import "server-only";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { buildXPostText, withXUtmParams } from "@/shared/api/x-post/format";
import type { NewsArticleContent } from "@/types/supabase";

export async function sendNewsArticleToSlack(
  articleContent: NewsArticleContent,
  date: string,
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("SLACK_WEBHOOK_URL not configured, skipping notification", {
      module: LOG_MODULES.LIB.SLACK,
    });
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://money-nav.com";
  const articleUrl = `${appUrl}/news-articles/${date}`;
  const xPostText = buildXPostText(articleContent, withXUtmParams(articleUrl));

  const sectionHeadings = articleContent.sections
    .map((s) => `• ${s.heading}`)
    .join("\n");
  const relatedTopics = articleContent.relatedTopics.join(" | ");

  const lines = [
    `📰 ニュース記事が生成されました | ${date}`,
    "",
    `*【テーマ】${articleContent.theme}*`,
    `*${articleContent.title}*`,
    "",
    "📚 *記事の構成*",
    sectionHeadings,
    "",
    "💰 *投資家インサイト*",
    articleContent.investorInsight,
    "",
    `🏷️ 関連テーマ: ${relatedTopics}`,
    "",
    articleUrl,
    "",
    "✉️ *Xポスト用:*",
    xPostText,
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
