import type { Metadata } from "next";
import { TomorrowImpactPage } from "@/views/tomorrow-impact";
import { BRAND } from "@/shared/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "明日の好悪材料分析 | 適時開示から学ぶ翌営業日の相場材料",
  description:
    "上場企業の適時開示を AI が好材料・悪材料に分類し、初心者向けに「今日学べる概念」と「詳しい解説」を添えて紹介します。翌営業日の相場材料を学習しながら把握できます。",
  keywords: [
    "適時開示",
    "好材料",
    "悪材料",
    "翌営業日",
    "投資初心者",
    "株式投資 学習",
    "決算",
    "上方修正",
    "自社株買い",
  ],
  openGraph: {
    title: "明日の好悪材料分析 | 適時開示から学ぶ翌営業日の相場材料",
    description:
      "上場企業の適時開示を AI が好材料・悪材料に分類し、初心者向けに解説します。",
    type: "website",
    locale: "ja_JP",
    url: "/tomorrow-impact",
    siteName: BRAND.NAME,
    images: [
      {
        url: "/tomorrow-impact/opengraph-image",
        width: 1200,
        height: 630,
        alt: "明日の好悪材料分析 | 適時開示から学ぶ翌営業日の相場材料",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "明日の好悪材料分析 | 適時開示から学ぶ翌営業日の相場材料",
    description:
      "上場企業の適時開示を AI が好材料・悪材料に分類し、初心者向けに解説します。",
    images: ["/tomorrow-impact/opengraph-image"],
  },
  alternates: { canonical: "/tomorrow-impact" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function Page() {
  return <TomorrowImpactPage />;
}
