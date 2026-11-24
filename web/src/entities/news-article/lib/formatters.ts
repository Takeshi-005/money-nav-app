import type { NewsArticle } from "../model/types";

export function generateArticleSEOTitle(article: NewsArticle): string {
  return article.seo_title ?? article.article_content.title;
}

export function generateArticleSEODescription(article: NewsArticle): string {
  return article.seo_description ?? article.article_content.summary;
}

export function getArticleSEOKeywords(article: NewsArticle): string[] {
  if (article.seo_keywords && article.seo_keywords.length > 0) {
    return article.seo_keywords;
  }
  return [
    "投資ニュース",
    article.article_content.theme,
    "投資初心者",
    "解説",
  ];
}

export function formatArticleDateForBreadcrumb(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
}
