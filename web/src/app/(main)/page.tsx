import type { Metadata } from "next";
import { HomePage } from "@/views/home";
import { BRAND, BRAND_TITLE_DEFAULT } from "@/shared/config";
import { serializeJsonLd } from "@/shared/lib/json-ld";

export const metadata: Metadata = {
  title: {
    absolute: BRAND_TITLE_DEFAULT,
  },
  description:
    "投資初心者のための学習支援アプリ。投資スタイル診断で自分に合った投資法を発見、デイリークイズで投資判断力を鍛え、市場変動時にはAIが読み解き方を解説。銘柄推奨ではなく「判断力を養う」教育サービスです。完全無料。",
  keywords: [
    "投資",
    "AI",
    "投資スタイル診断",
    "ニュースクイズ",
    "市場解説",
    "株価下落",
    "投資学習",
    "初心者",
    "無料",
    "株式投資",
  ],
  openGraph: {
    title: BRAND_TITLE_DEFAULT,
    description:
      "投資初心者のための学習支援アプリ。銘柄推奨ではなく「判断力を養う」教育サービス。診断・クイズ・市場解説で投資の読み解き方を学べます。",
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: BRAND.NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_TITLE_DEFAULT,
    description:
      "投資初心者のための学習支援アプリ。銘柄推奨ではなく判断力を養う教育サービスです。",
  },
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://money-nav.com";

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: BRAND.NAME,
    alternateName: ["Maneippo", "money-nav"],
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [BRAND.X_URL],
    description:
      "投資初心者向けのAI投資学習サービス。銘柄推奨は行わず、診断・クイズ・ニュース解説で投資の判断力を養う教育サービス。",
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: BRAND.NAME,
    description:
      "投資初心者のための学習支援アプリ。AI投資スタイル診断、デイリーニュースクイズ、市場解説で投資を学べます。",
    url: baseUrl,
    publisher: { "@id": `${baseUrl}/#organization` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationData) }}
      />
      <HomePage />
    </>
  );
}
