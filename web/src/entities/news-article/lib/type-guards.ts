import type { NewsArticle, NewsArticleContent } from "../model/types";

export function isNewsArticleContent(
  data: unknown,
): data is NewsArticleContent {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const c = data as Record<string, unknown>;
  return (
    typeof c.title === "string" &&
    typeof c.summary === "string" &&
    typeof c.theme === "string" &&
    Array.isArray(c.sections) &&
    typeof c.investorInsight === "string" &&
    Array.isArray(c.relatedTopics)
  );
}

export function toNewsArticle(data: unknown): NewsArticle | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const record = data as Record<string, unknown>;

  if (
    !("date" in record) ||
    !("article_content" in record) ||
    !("created_at" in record)
  ) {
    return null;
  }

  if (!isNewsArticleContent(record.article_content)) {
    return null;
  }

  const seoKeywords = record.seo_keywords;
  return {
    date: String(record.date),
    article_content: record.article_content as NewsArticleContent,
    created_at: String(record.created_at),
    seo_title:
      typeof record.seo_title === "string" ? record.seo_title : null,
    seo_description:
      typeof record.seo_description === "string"
        ? record.seo_description
        : null,
    seo_keywords: Array.isArray(seoKeywords)
      ? seoKeywords.filter((k): k is string => typeof k === "string")
      : null,
  };
}
