import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { ai, GEMINI_MODEL } from "@/shared/api/gemini/client";
import { callGeminiWithRetry } from "@/shared/api/gemini/retry";
import { fetchPageAuditDetail } from "./page-audit";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

export interface SuggestSeoResult {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedKeywords: string[];
  reasoning: string;
  basedOnQueries: string[];
}

const suggestionSchema = z.object({
  suggestedTitle: z.string().min(1).max(80),
  suggestedDescription: z.string().min(1).max(200),
  suggestedKeywords: z.array(z.string()).min(1).max(8),
  reasoning: z.string().min(1).max(500),
});

interface NewsArticleContext {
  date: string;
  title: string;
  summary: string;
  theme: string;
}

async function fetchNewsArticleContext(
  supabase: SupabaseClient<Database>,
  pagePath: string,
): Promise<NewsArticleContext | null> {
  const match = pagePath.match(/^\/news-articles\/(\d{4}-\d{2}-\d{2})$/);
  if (!match) {
    return null;
  }
  const date = match[1];
  const { data } = await supabase
    .from("news_articles")
    .select("date, article_content")
    .eq("date", date)
    .single();
  if (!data) {
    return null;
  }
  const content = data.article_content as Record<string, unknown>;
  return {
    date: data.date,
    title: typeof content.title === "string" ? content.title : "",
    summary: typeof content.summary === "string" ? content.summary : "",
    theme: typeof content.theme === "string" ? content.theme : "",
  };
}

function buildSuggesterPrompt(
  pagePath: string,
  topQueries: { query: string; impressions: number; position: number; ctr: number }[],
  articleContext: NewsArticleContext | null,
): string {
  const queriesSection =
    topQueries.length > 0
      ? topQueries
          .map(
            (q) =>
              `- 「${q.query}」 表示${q.impressions}回 / 順位${q.position.toFixed(1)} / CTR${(q.ctr * 100).toFixed(2)}%`,
          )
          .join("\n")
      : "（実需要キーワードのデータなし。記事内容から推定すること）";

  const articleSection = articleContext
    ? `\n## ページの本文情報\n- 日付: ${articleContext.date}\n- 現タイトル: ${articleContext.title}\n- 現リード文: ${articleContext.summary}\n- テーマ: ${articleContext.theme}\n`
    : "";

  return `あなたは投資初心者向けWebサイトのSEO専門家です。
以下のページの<title>とmeta descriptionを、実需要のあるキーワードを軸に書き換える提案をしてください。

## 対象ページ
${pagePath}
${articleSection}
## 直近4週で実際にこのページを呼び出した検索クエリ
${queriesSection}

## 要件
- suggestedTitle: 60文字以内。**最も表示回数の多い実需要キーワードを必ず含める**こと。クリックされやすい初心者向け表現にする
- suggestedDescription: 100〜120文字。検索結果でクリックを促す要約。記事内容を正確に反映すること
- suggestedKeywords: 関連キーワード3〜5個（実需要キーワード + 関連語）
- reasoning: なぜこの提案にしたかを200文字以内で説明（どのクエリ・どの根拠を採用したか）

## 制約
- 記事本文と内容が乖離するタイトルは禁止（誇張・釣りタイトルNG）
- 「2026年X月X日の～」のような日付ベースの羅列は避ける
- 実需要キーワードがゼロの場合は、ページパスとカテゴリから一般的な投資初心者向けキーワードを推定すること

JSON形式で出力すること。コードフェンス禁止:
{
  "suggestedTitle": "...",
  "suggestedDescription": "...",
  "suggestedKeywords": ["...", "..."],
  "reasoning": "..."
}`;
}

export async function suggestSeoTitle(
  supabase: SupabaseClient<Database>,
  pagePath: string,
): Promise<SuggestSeoResult> {
  const audit = await fetchPageAuditDetail(supabase, pagePath);
  if (!audit) {
    throw new Error(`Page not found in known pages: ${pagePath}`);
  }

  const articleContext = await fetchNewsArticleContext(supabase, pagePath);
  const prompt = buildSuggesterPrompt(pagePath, audit.topQueries, articleContext);

  const response = await callGeminiWithRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 },
    }),
  );

  const text = response.text;
  if (!text) {
    throw new Error("Gemini APIからの応答が空です");
  }

  const jsonText = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const parsed = suggestionSchema.safeParse(JSON.parse(jsonText));
  if (!parsed.success) {
    logger.warn("title-suggester response failed validation", {
      module: LOG_MODULES.API.ADMIN_SEO_AUDIT,
      errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    });
    throw new Error("Gemini応答のスキーマ検証に失敗しました");
  }

  return {
    suggestedTitle: parsed.data.suggestedTitle,
    suggestedDescription: parsed.data.suggestedDescription,
    suggestedKeywords: parsed.data.suggestedKeywords,
    reasoning: parsed.data.reasoning,
    basedOnQueries: audit.topQueries.map((q) => q.query),
  };
}
