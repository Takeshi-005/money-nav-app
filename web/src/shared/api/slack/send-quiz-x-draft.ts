import "server-only";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { BRAND } from "@/shared/config";
import { withXUtmParams } from "@/shared/api/x-post/format";
import type { SingleQuiz } from "@/types/supabase";

const OPTION_MARKERS = ["①", "②", "③", "④"];
const MAX_QUESTION_LENGTH = 80;
const HASHTAGS = "#投資初心者 #投資クイズ #株式投資";
const QUIZ_URL = withXUtmParams(`https://${BRAND.DOMAIN}/quiz`);

function formatForX(quiz: SingleQuiz): string {
  const question =
    quiz.question.length > MAX_QUESTION_LENGTH
      ? `${quiz.question.slice(0, MAX_QUESTION_LENGTH)}…`
      : quiz.question;

  const options = quiz.options
    .map((opt, i) => `${OPTION_MARKERS[i] ?? `${i + 1}.`} ${opt.text}`)
    .join("\n");

  return [
    `📊 【${quiz.title}】`,
    "",
    question,
    "",
    options,
    "",
    `👇 答えと解説はこちら\n${QUIZ_URL}`,
    "",
    HASHTAGS,
  ].join("\n");
}

export async function sendQuizXDraftToSlack(quizzes: SingleQuiz[]): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("SLACK_WEBHOOK_URL not configured, skipping quiz X draft", {
      module: LOG_MODULES.LIB.SLACK,
    });
    return;
  }

  const targetQuiz =
    quizzes.find((q) => q.quiz_type === "basic") ??
    quizzes.find((q) => q.quiz_type === "news") ??
    quizzes[0];

  if (!targetQuiz) {return;}

  const tweetDraft = formatForX(targetQuiz);

  const lines = [
    "📋 *今日のXポスト下書き*",
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
      logger.error("Failed to send quiz X draft to Slack", {
        module: LOG_MODULES.LIB.SLACK,
        status: response.status,
      });
    }
  } catch (error) {
    logger.error("Slack quiz X draft notification failed", {
      module: LOG_MODULES.LIB.SLACK,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
