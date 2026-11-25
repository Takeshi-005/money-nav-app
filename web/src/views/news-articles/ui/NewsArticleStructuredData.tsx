import type { NewsArticle } from "@/entities/news-article";
import {
  generateArticleSEOTitle,
  generateArticleSEODescription,
  formatArticleDateForBreadcrumb,
} from "@/entities/news-article";
import {
  buildAuthor,
  buildBreadcrumbList,
  buildPublisher,
  getBaseUrl,
} from "@/shared/lib/structured-data";
import { serializeJsonLd } from "@/shared/lib/json-ld";

interface Props {
  article: NewsArticle;
}

export function NewsArticleStructuredData({ article }: Props) {
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/news-articles/${article.date}`;
  const publishedAt = `${article.date}T07:00:00+09:00`;

  const newsArticleData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: generateArticleSEOTitle(article),
    description: generateArticleSEODescription(article),
    image: `${baseUrl}/news-articles/${article.date}/opengraph-image`,
    datePublished: publishedAt,
    dateModified: article.created_at ?? publishedAt,
    author: buildAuthor(baseUrl),
    publisher: buildPublisher(baseUrl),
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    inLanguage: "ja",
    isAccessibleForFree: true,
  };

  const breadcrumbData = buildBreadcrumbList(
    [
      { name: "ホーム", path: "/" },
      { name: "ニュース解説", path: "/news-articles" },
      { name: formatArticleDateForBreadcrumb(article.date) },
    ],
    baseUrl,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(newsArticleData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbData) }}
      />
    </>
  );
}
