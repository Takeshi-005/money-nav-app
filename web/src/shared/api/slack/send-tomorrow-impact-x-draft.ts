import "server-only";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { BRAND } from "@/shared/config";
import {
  getWeightedLength,
  trimToWeight,
  withXUtmParams,
  X_MAX_WEIGHT,
  X_URL_WEIGHT,
} from "@/shared/api/x-post/format";

const HASHTAGS = "#明日の好悪材料 #投資初心者 #株式投資";
const ELLIPSIS = "…";
const SEPARATOR = "\n\n";
const CTA = "ニュースが翌営業日の株価にどう作用するかをAIが解説👇";

export interface TomorrowImpactXDraftInput {
  articleDate: string;
  positiveCount: number;
  negativeCount: number;
  topKeyConcepts: string[];
  topSocialSummary?: string;
}

function buildHeader(input: TomorrowImpactXDraftInput): string {
  return `📊 明日のニュース材料｜好材料${input.positiveCount}件・悪材料${input.negativeCount}件`;
}

function buildThemeLine(topKeyConcepts: string[]): string {
  if (topKeyConcepts.length === 0) {
    return "";
  }
  return `注目テーマ: ${topKeyConcepts.join("／")}`;
}

export function buildTomorrowImpactXPostText(
  input: TomorrowImpactXDraftInput,
): string {
  const url = withXUtmParams(
    `https://${BRAND.DOMAIN}/tomorrow-impact/${input.articleDate}`,
  );
  const header = buildHeader(input);
  const highlight = input.topSocialSummary?.trim() || buildThemeLine(input.topKeyConcepts);

  const bodyParts = [];
  if (highlight) {
    bodyParts.push(highlight);
  }
  bodyParts.push(CTA);
  const body = bodyParts.join("\n");

  const separatorWeight = getWeightedLength(SEPARATOR) * 3;
  const fixedWeight =
    getWeightedLength(header) +
    getWeightedLength(HASHTAGS) +
    separatorWeight +
    X_URL_WEIGHT;

  if (getWeightedLength(body) + fixedWeight <= X_MAX_WEIGHT) {
    return [header, body, url, HASHTAGS].join(SEPARATOR);
  }

  const maxBodyWeight =
    X_MAX_WEIGHT - fixedWeight - getWeightedLength(ELLIPSIS);
  if (maxBodyWeight <= 0) {
    return [header, url, HASHTAGS].join(SEPARATOR);
  }
  const trimmed = `${trimToWeight(body, maxBodyWeight)}${ELLIPSIS}`;
  return [header, trimmed, url, HASHTAGS].join(SEPARATOR);
}

export async function sendTomorrowImpactXDraftToSlack(
  input: TomorrowImpactXDraftInput,
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn(
      "SLACK_WEBHOOK_URL not configured, skipping tomorrow-impact X draft",
      { module: LOG_MODULES.LIB.SLACK },
    );
    return;
  }

  const tweetDraft = buildTomorrowImpactXPostText(input);

  const lines = [
    "📋 *明日の好悪材料 Xポスト下書き*",
    "コピーして公式アカウントから投稿してください👇",
    "",
    `\`\`\`${tweetDraft}\`\`\``,
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
      logger.error("Failed to send tomorrow-impact X draft to Slack", {
        module: LOG_MODULES.LIB.SLACK,
        status: response.status,
      });
    }
  } catch (error) {
    logger.error("Slack tomorrow-impact X draft notification failed", {
      module: LOG_MODULES.LIB.SLACK,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
