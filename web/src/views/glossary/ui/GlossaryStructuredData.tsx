import type { GlossaryTerm } from "@/entities/glossary-term";
import {
  buildAuthor,
  buildBreadcrumbList,
  buildPublisher,
  getBaseUrl,
} from "@/shared/lib/structured-data";

interface Props {
  term: GlossaryTerm;
}

export function GlossaryStructuredData({ term }: Props) {
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/glossary/${term.slug}`;

  const definedTermData = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.definition,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "投資用語辞典",
      url: `${baseUrl}/glossary`,
    },
  };

  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${term.term}とは？初心者向けにわかりやすく解説`,
    description: term.definition,
    author: buildAuthor(baseUrl),
    publisher: buildPublisher(baseUrl),
    datePublished: term.created_at,
    dateModified: term.updated_at,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    inLanguage: "ja",
    isAccessibleForFree: true,
  };

  const breadcrumbData = buildBreadcrumbList(
    [
      { name: "ホーム", path: "/" },
      { name: "用語辞典", path: "/glossary" },
      { name: term.term },
    ],
    baseUrl,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
  );
}
