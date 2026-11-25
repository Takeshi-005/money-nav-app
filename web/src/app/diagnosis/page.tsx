import { Suspense } from "react";
import type { Metadata } from "next";
import { DiagnosisPage } from "@/views/diagnosis";
import { DIAGNOSIS_FAQ_ITEMS } from "@/views/diagnosis/lib/faq-data";
import { buildFaqPage } from "@/shared/lib/structured-data";
import { BRAND } from "@/shared/config";
import { serializeJsonLd } from "@/shared/lib/json-ld";

export const metadata: Metadata = {
  title: "AI投資スタイル診断 | あなたは8タイプのどれ？",
  description:
    "完全無料・登録不要・5分で完了。9つの質問に答えるだけで、AIがあなたの投資スタイルを8タイプから診断。バフェット型・リンチ型・グレアム型など世界的投資家の哲学に当てはめて、自分に合った投資の始め方が見つかります。",
  keywords: [
    "投資 診断",
    "投資 初心者",
    "投資スタイル診断",
    "投資家タイプ 診断 無料",
    "AI投資診断",
    "投資 始め方",
    "投資 自分に合った",
    "投資適性診断",
    "バフェット型",
    "リンチ型",
    "投資スタイル判定",
  ],
  openGraph: {
    title: "AI投資スタイル診断 | 完全無料・5分・登録不要",
    description:
      "9つの質問でAIがあなたの投資スタイルを8タイプから分析。完全無料・登録不要・5分で完了。投資初心者でも安心して受けられる診断です。",
    type: "website",
    locale: "ja_JP",
    url: "/diagnosis",
    siteName: BRAND.NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "AI投資スタイル診断 | 完全無料・5分・登録不要",
    description:
      "9つの質問でAIがあなたの投資スタイルを8タイプから分析。完全無料・登録不要・5分で診断できます。",
  },
  alternates: {
    canonical: "/diagnosis",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function Page() {
  const quizStructuredData = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: "AI投資スタイル診断",
    description:
      "9つの質問に答えるだけで、AIがあなたの投資スタイルを8タイプに分類します。",
    educationalLevel: "初心者",
    teaches: "投資スタイルの自己理解",
    timeRequired: "PT5M",
    isAccessibleForFree: true,
    inLanguage: "ja",
  };

  const faqStructuredData = buildFaqPage(DIAGNOSIS_FAQ_ITEMS);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(quizStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqStructuredData) }}
      />
      <Suspense fallback={null}>
        <DiagnosisPage />
      </Suspense>
    </>
  );
}
