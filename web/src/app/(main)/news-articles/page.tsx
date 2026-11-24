import type { Metadata } from "next";
import { NewsArticlesPage } from "@/views/news-articles";
import { BRAND } from "@/shared/config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "投資ニュース解説 | ニュースの読み解き方を学ぶ教育コンテンツ",
  description:
    "投資関連ニュースを初心者向けに解説する教育コンテンツ。専門用語の解説・投資家目線の分析・判断のポイントを学べます。「銘柄を教える」のではなく「ニュースから投資判断する力」を養います。",
  keywords: [
    "投資ニュース 解説",
    "投資教育",
    "投資判断力",
    "ニュース 読み解き方",
    "投資初心者 学習",
    "経済ニュース 初心者",
    "株式投資 勉強",
  ],
  openGraph: {
    title: "投資ニュース解説 | ニュースの読み解き方を学ぶ教育コンテンツ",
    description:
      "ニュースから投資判断する力を養う教育コンテンツ。初心者向けに専門用語と判断のポイントを解説。",
    type: "website",
    locale: "ja_JP",
    url: "/news-articles",
    siteName: BRAND.NAME,
  },
  twitter: { card: "summary" },
  alternates: { canonical: "/news-articles" },
  robots: { index: true, follow: true },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": ["CollectionPage", "LearningResource"],
  name: "投資ニュース解説｜ニュースの読み解き方を学ぶ",
  description:
    "投資関連ニュースの読み解き方を初心者向けに解説する教育コンテンツ",
  learningResourceType: "教育記事",
  educationalLevel: "初心者〜中級者",
  teaches: "投資ニュースの読み解き方、専門用語の理解、投資判断力",
  inLanguage: "ja",
  isAccessibleForFree: true,
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <NewsArticlesPage />
    </>
  );
}
