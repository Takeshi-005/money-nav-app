import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/shared/api/supabase/admin";
import {
  toNewsArticle,
  isValidDate,
  isNotFutureDate,
  generateArticleSEOTitle,
  generateArticleSEODescription,
  getArticleSEOKeywords,
  formatArticleDateForBreadcrumb,
} from "@/entities/news-article";
import { NewsArticleDetailPage } from "@/views/news-articles";
import { NewsArticleStructuredData } from "@/views/news-articles/ui/NewsArticleStructuredData";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { BRAND, buildPageTitle } from "@/shared/config";

export const revalidate = 86400;
export const dynamicParams = true;

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;

  if (!isValidDate(date) || !isNotFutureDate(date)) {
    return { title: "不正なURLです" };
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("news_articles")
    .select("*")
    .eq("date", date)
    .single();

  if (!data) {
    return { title: "記事が見つかりません" };
  }

  const article = toNewsArticle(data);
  if (!article) {
    return { title: "データ形式が不正です" };
  }

  const title = generateArticleSEOTitle(article);
  const description = generateArticleSEODescription(article);
  const fullTitle = buildPageTitle(title);

  return {
    title,
    description,
    keywords: getArticleSEOKeywords(article),
    openGraph: {
      title: fullTitle,
      description,
      type: "article",
      publishedTime: `${date}T00:00:00+09:00`,
      locale: "ja_JP",
      url: `/news-articles/${date}`,
      siteName: BRAND.NAME,
      images: [
        {
          url: `/news-articles/${date}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [`/news-articles/${date}/opengraph-image`],
    },
    alternates: { canonical: `/news-articles/${date}` },
    robots: { index: true, follow: true },
  };
}

export async function generateStaticParams() {
  const supabase = createAdminClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data } = await supabase
    .from("news_articles")
    .select("date")
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  return (data ?? []).map((a) => ({ date: a.date }));
}

export default async function Page({ params }: Props) {
  const { date } = await params;

  if (!isValidDate(date) || !isNotFutureDate(date)) {
    notFound();
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("news_articles")
    .select("*")
    .eq("date", date)
    .single();

  if (!data) {
    notFound();
  }

  const article = toNewsArticle(data);
  if (!article) {
    logger.error("Invalid news article data", {
      module: LOG_MODULES.APP.NEWS_ARTICLES,
      date,
    });
    notFound();
  }

  const breadcrumbItems = [
    { label: "ホーム", href: "/" },
    { label: "ニュース解説", href: "/news-articles" },
    { label: formatArticleDateForBreadcrumb(date) },
  ];

  return (
    <>
      <NewsArticleStructuredData article={article} />
      <Breadcrumbs
        items={breadcrumbItems}
        className="max-w-6xl mx-auto px-4 pt-4"
      />
      <NewsArticleDetailPage article={article} />
    </>
  );
}
