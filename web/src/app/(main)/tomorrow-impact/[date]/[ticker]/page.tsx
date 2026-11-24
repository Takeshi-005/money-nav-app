import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DisclosureEventPage,
  getDateTickerPairs,
  getImpactEventByDateTicker,
} from "@/views/tomorrow-impact";
import { DISCLOSURE_TYPE_LABELS } from "@/shared/api/gemini/disclosure-extraction";
import { BRAND, NAVIGATION_BUILDERS, buildPageTitle } from "@/shared/config";
import { isValidDate, isNotFutureDate, formatDateJapanese } from "@/shared/lib/date";

export const revalidate = 86400;
export const dynamicParams = true;

const STATIC_PARAMS_LIMIT = 120;
const TICKER_PATTERN = /^[0-9][0-9A-Z]{3,4}$/;

const IMPACT_LABEL: Record<"positive" | "negative" | "neutral", string> = {
  positive: "好材料",
  negative: "悪材料",
  neutral: "中立材料",
};

function isValidTicker(ticker: string): boolean {
  return TICKER_PATTERN.test(ticker);
}

interface Props {
  params: Promise<{ date: string; ticker: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date, ticker } = await params;

  if (!isValidDate(date) || !isNotFutureDate(date) || !isValidTicker(ticker)) {
    return { title: "不正なURLです" };
  }

  const event = await getImpactEventByDateTicker(date, ticker);
  if (!event) {
    return { title: "開示情報が見つかりません" };
  }

  const typeLabel = DISCLOSURE_TYPE_LABELS[event.disclosure_type];
  const impactLabel = IMPACT_LABEL[event.impact];
  const dateLabel = formatDateJapanese(date);
  const title = `${event.company_name}（${ticker}）の${typeLabel}は${impactLabel}？株価への影響をやさしく解説`;
  const description = `${dateLabel}発表。${event.company_name}（証券コード${ticker}）の${typeLabel}が翌営業日の${impactLabel}となりうる理由を、AIが初心者向けに解説します。`;
  const pagePath = NAVIGATION_BUILDERS.tomorrowImpactEventDetail(date, ticker);

  return {
    title,
    description,
    keywords: [
      event.company_name,
      `${event.company_name} ${typeLabel}`,
      `${typeLabel} 株価 影響`,
      `${typeLabel} とは`,
      typeLabel,
      "適時開示",
      "好材料 悪材料",
      "株式投資 初心者",
    ],
    openGraph: {
      title: buildPageTitle(title),
      description,
      type: "article",
      publishedTime: `${date}T07:00:00+09:00`,
      locale: "ja_JP",
      url: pagePath,
      siteName: BRAND.NAME,
    },
    twitter: { card: "summary", title: buildPageTitle(title), description },
    alternates: { canonical: pagePath },
    robots: { index: true, follow: true },
  };
}

export async function generateStaticParams() {
  const pairs = await getDateTickerPairs(STATIC_PARAMS_LIMIT);
  return pairs.map(({ date, ticker }) => ({ date, ticker }));
}

export default async function Page({ params }: Props) {
  const { date, ticker } = await params;

  if (!isValidDate(date) || !isNotFutureDate(date) || !isValidTicker(ticker)) {
    notFound();
  }

  return <DisclosureEventPage date={date} ticker={ticker} />;
}
