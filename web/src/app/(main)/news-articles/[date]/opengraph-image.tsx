import { createAdminClient } from "@/shared/api/supabase/admin";
import {
  toNewsArticle,
  isValidDate,
  isNotFutureDate,
} from "@/entities/news-article";
import {
  createOgImageResponse,
  OG_SIZE,
} from "@/shared/lib/og-image/createOgImageResponse";

export const runtime = "nodejs";
export const alt = "ニュース解説記事";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  if (!isValidDate(date) || !isNotFutureDate(date)) {
    return createOgImageResponse({ title: "ニュース解説記事" });
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("news_articles")
    .select("*")
    .eq("date", date)
    .single();

  if (!data) {
    return createOgImageResponse({ title: "ニュース解説記事" });
  }

  const article = toNewsArticle(data);
  if (!article) {
    return createOgImageResponse({ title: "ニュース解説記事" });
  }

  return createOgImageResponse({
    title: article.article_content.title,
    badge: article.article_content.theme,
    subtitle: article.article_content.summary.slice(0, 80),
    footer: date,
  });
}
