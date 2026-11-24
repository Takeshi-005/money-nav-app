import type { Metadata } from "next"
import { QuizPage } from "@/views/quiz"
import { BRAND } from "@/shared/config";

export const metadata: Metadata = {
  title: "予測トレーニング | 日経平均を予測して投資判断力を鍛えよう",
  description:
    "毎日1問、最新ニュースをもとに日経平均の方向を予測。翌朝に答え合わせ。的中率・累積PnL・連勝数で自分の投資判断力を可視化。投資初心者向け、完全無料。",
  keywords: [
    "投資予測",
    "日経平均予測",
    "投資判断力",
    "予測トレーニング",
    "株式投資学習",
    "PnL",
    "的中率",
    "投資初心者",
    "マーケット予測",
  ],
  openGraph: {
    title: "予測トレーニング | 日経平均を予測して投資判断力を鍛えよう",
    description:
      "毎日1問、ニュースをもとに日経平均を予測。翌朝に答え合わせ。的中率・PnLで成長を実感できます。",
    type: "website",
    locale: "ja_JP",
    url: "/quiz",
    siteName: BRAND.NAME,
  },
  twitter: {
    card: "summary",
    title: "予測トレーニング | 日経平均を予測して投資判断力を鍛えよう",
    description: "毎日1問の日経平均予測で投資判断力を磨こう。的中率・PnLを追跡。",
  },
  alternates: {
    canonical: "/quiz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function Page() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: "予測トレーニング",
    description:
      "最新ニュースをもとに日経平均の方向を毎日予測し、翌朝に答え合わせ。的中率・累積PnLで投資判断力を可視化。",
    learningResourceType: "練習",
    educationalLevel: "初心者〜上級者",
    teaches: "投資判断力、マーケット読解力、ニュース分析",
    timeRequired: "PT1M",
    isAccessibleForFree: true,
    inLanguage: "ja",
    publisher: {
      "@type": "Organization",
      name: BRAND.NAME,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <QuizPage />
    </>
  )
}
