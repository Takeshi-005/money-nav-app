import type { NewsArticle } from "../model/types";

export async function fetchNewsArticle(date?: string): Promise<NewsArticle> {
  const url = date ? `/api/news-articles?date=${date}` : "/api/news-articles";
  const res = await fetch(url);
  if (res.status === 404) {
    throw new Error("この日付の記事はまだ作成されていません");
  }
  if (!res.ok) {
    throw new Error("ニュース解説記事の取得に失敗しました");
  }
  return res.json();
}
