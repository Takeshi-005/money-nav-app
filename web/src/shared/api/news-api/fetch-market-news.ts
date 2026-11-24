import { fetchGoogleNewsRss } from "./rss-client";
import type { NewsArticle } from "./types";

export interface MarketNewsParams {
  date: string;
  maxResults?: number;
}

export async function fetchMarketNews(
  params: MarketNewsParams,
): Promise<NewsArticle[]> {
  const query = [
    "日経平均",
    "TOPIX",
    "東証株価指数",
    "東京証券取引所",
    "株式市場",
    "円相場",
    "為替",
    "日銀",
    "金融政策",
    "衆議院選挙",
    "参議院選挙",
    "内閣",
    "首相",
  ].join(" OR ");

  const articles = await fetchGoogleNewsRss(query, 3);

  const start = new Date(`${params.date}T00:00:00+09:00`);
  start.setHours(start.getHours() - 24);
  const end = new Date(`${params.date}T23:59:59+09:00`);

  return articles
    .filter((article) => {
      const pub = new Date(article.publishedAt);
      const isInRange = pub >= start && pub <= end;
      const hasValidUrl = article.url && article.url.startsWith("http");
      const hasValidTitle = article.title && article.title.length > 10;
      return isInRange && hasValidUrl && hasValidTitle;
    })
    .slice(0, params.maxResults ?? 20);
}
