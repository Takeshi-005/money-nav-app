import type { NewsArticle } from "@/entities/news-article";
import { NewsArticleCard } from "@/widgets/news-article-card";
import {
  buildBreadcrumbList,
  buildPublisher,
} from "@/shared/lib/structured-data";
import { findAllGlossaryTerms } from "@/entities/glossary-term";
import { BRAND } from "@/shared/config";
import type { LinkableTerm } from "@/shared/lib/auto-link-glossary";
import { DateNavigation } from "./DateNavigation";

interface Props {
  article: NewsArticle;
}

async function loadGlossaryLinkableTerms(): Promise<LinkableTerm[]> {
  try {
    const terms = await findAllGlossaryTerms();
    return terms.map((t) => ({ term: t.term, slug: t.slug }));
  } catch {
    return [];
  }
}

export async function NewsArticleDetailPage({ article }: Props) {
  const glossaryTerms = await loadGlossaryLinkableTerms();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.article_content.title,
    description: article.article_content.summary,
    datePublished: `${article.date}T07:00:00+09:00`,
    dateModified: article.created_at,
    author: {
      "@type": "Organization",
      name: BRAND.NAME,
    },
    publisher: buildPublisher(),
    inLanguage: "ja",
    isAccessibleForFree: true,
    about: {
      "@type": "Thing",
      name: article.article_content.theme,
    },
    keywords: article.article_content.relatedTopics.join(", "),
  };

  const breadcrumbData = buildBreadcrumbList([
    { name: "ホーム", path: "/" },
    { name: "ニュース解説", path: "/news-articles" },
    { name: article.article_content.title },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <div className="min-h-screen max-w-2xl mx-auto my-8 px-6 sm:px-8 py-8 bg-surface-secondary rounded-2xl shadow-sm">
        <NewsArticleCard article={article} glossaryTerms={glossaryTerms} />
        <DateNavigation
          currentDate={article.date}
          className="max-w-2xl mx-auto px-4 mt-8 pb-8"
        />
      </div>
    </>
  );
}
