import { AUTHOR, BRAND } from "@/shared/config";

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://money-nav.com";
}

interface SchemaPerson {
  "@type": "Person";
  name: string;
  description: string;
  url: string;
  sameAs: string[];
}

export function buildAuthor(baseUrl?: string): SchemaPerson {
  const url = baseUrl ?? getBaseUrl();
  return {
    "@type": "Person",
    name: AUTHOR.NAME,
    description: AUTHOR.TITLE,
    url: `${url}/about`,
    sameAs: [BRAND.X_URL],
  };
}

interface SchemaOrganization {
  "@type": "Organization";
  name: string;
  logo: {
    "@type": "ImageObject";
    url: string;
  };
}

export function buildPublisher(baseUrl?: string): SchemaOrganization {
  const url = baseUrl ?? getBaseUrl();
  return {
    "@type": "Organization",
    name: BRAND.NAME,
    logo: {
      "@type": "ImageObject",
      url: `${url}/logo.png`,
    },
  };
}

interface BreadcrumbInputItem {
  name: string;
  path?: string;
}

interface SchemaBreadcrumbListItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item?: string;
}

interface SchemaBreadcrumbList {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: SchemaBreadcrumbListItem[];
}

export function buildBreadcrumbList(
  items: BreadcrumbInputItem[],
  baseUrl?: string,
): SchemaBreadcrumbList {
  const url = baseUrl ?? getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: `${url}${item.path}` } : {}),
    })),
  };
}

interface FaqInputItem {
  question: string;
  answer: string;
}

interface SchemaFaqQuestion {
  "@type": "Question";
  name: string;
  acceptedAnswer: {
    "@type": "Answer";
    text: string;
  };
}

interface SchemaFaqPage {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: SchemaFaqQuestion[];
}

export function buildFaqPage(items: FaqInputItem[]): SchemaFaqPage {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
