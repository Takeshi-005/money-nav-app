import type { DisclosureImpactAnalysis } from "@/features/disclosure-impact-data";
import { toJstIsoString } from "@/shared/lib/date";
import { NAVIGATION_PATHS } from "@/shared/config";
import {
  buildBreadcrumbList,
  buildPublisher,
  getBaseUrl,
} from "@/shared/lib/structured-data";

interface Props {
  latestDate: string;
  stocks: DisclosureImpactAnalysis[];
  latestCreatedAt: string | null;
  /** 日付詳細ページのパス（例: "/tomorrow-impact/2026-06-22"）。省略時は一覧ページ。 */
  pagePath?: string;
  /** 構造化データ/パンくず末尾の名称。省略時は一覧ページ名。 */
  pageName?: string;
}

const DEFAULT_PAGE_NAME = "明日の好悪材料分析";

const IMPACT_LABEL: Record<DisclosureImpactAnalysis["impact"], string> = {
  positive: "好材料",
  negative: "悪材料",
  neutral: "中立",
};

const MAX_ITEM_LIST_ENTRIES = 20;
const DESCRIPTION_MAX_LENGTH = 160;

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}

export function TomorrowImpactStructuredData({
  latestDate,
  stocks,
  latestCreatedAt,
  pagePath = NAVIGATION_PATHS.TOMORROW_IMPACT,
  pageName = DEFAULT_PAGE_NAME,
}: Props) {
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}${pagePath}`;
  const isDetail = pagePath !== NAVIGATION_PATHS.TOMORROW_IMPACT;

  const itemListElement = stocks
    .slice(0, MAX_ITEM_LIST_ENTRIES)
    .map((stock, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      url: `${pageUrl}#stock-${stock.ticker_code}`,
      name: `${stock.company_name}（${stock.ticker_code}）— ${IMPACT_LABEL[stock.impact]}`,
      description: truncate(stock.reason, DESCRIPTION_MAX_LENGTH),
    }));

  const datePublished = latestDate ? `${latestDate}T07:00:00+09:00` : undefined;
  const dateModified = latestCreatedAt
    ? toJstIsoString(latestCreatedAt)
    : datePublished;

  const collectionPageData = {
    "@context": "https://schema.org",
    "@type": ["CollectionPage", "LearningResource"],
    name: pageName,
    description:
      "上場企業の適時開示を AI が好材料・悪材料に分類し、初心者向けに「今日学べる概念」と「詳しい解説」を添えて紹介します。",
    url: pageUrl,
    learningResourceType: "投資教育コンテンツ",
    educationalLevel: "初心者",
    teaches: "適時開示の読み方、好材料・悪材料の判別、投資判断の基礎",
    inLanguage: "ja",
    isAccessibleForFree: true,
    publisher: buildPublisher(baseUrl),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(itemListElement.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: itemListElement.length,
            itemListElement,
          },
        }
      : {}),
  };

  const breadcrumbTrail = isDetail
    ? [
        { name: "ホーム", path: "/" },
        { name: DEFAULT_PAGE_NAME, path: NAVIGATION_PATHS.TOMORROW_IMPACT },
        { name: pageName },
      ]
    : [{ name: "ホーム", path: "/" }, { name: DEFAULT_PAGE_NAME }];

  const breadcrumbData = buildBreadcrumbList(breadcrumbTrail, baseUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </>
  );
}
