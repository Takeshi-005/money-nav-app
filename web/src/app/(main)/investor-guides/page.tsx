import type { Metadata } from "next";
import { InvestorGuidesListPage } from "@/views/investor-guides-list";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { BRAND } from "@/shared/config";
import { serializeJsonLd } from "@/shared/lib/json-ld";

export const metadata: Metadata = {
  title: "投資家タイプ別ガイド | 自分に合った投資の学び方を見つける",
  description:
    "8つの投資家タイプ別に、投資哲学・学習ステップ・推奨書籍を解説する教育ガイド。バフェット型・リンチ型・ソロス型など、あなたのスタイルに合った「投資の学び方」が見つかります。",
  keywords: [
    "投資家タイプ",
    "投資ガイド",
    "投資スタイル",
    "投資初心者",
    "バフェット",
    "リンチ",
  ],
  openGraph: {
    title: "投資家タイプ別ガイド | 自分に合った投資の学び方を見つける",
    description:
      "8つの投資家タイプ別に投資哲学・学習ステップ・推奨書籍を解説する教育ガイド。",
    type: "website",
    locale: "ja_JP",
    url: "/investor-guides",
    siteName: BRAND.NAME,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/investor-guides" },
  robots: { index: true, follow: true },
};

const INVESTOR_TYPES = [
  {
    code: "buffett",
    name: "バフェット型（価値の賢者）",
    description: "企業の本質的価値を見極め、割安な優良株に長期投資するスタイル",
  },
  {
    code: "lynch",
    name: "リンチ型（成長の探求者）",
    description:
      "日常生活の中から成長企業を発見し、中長期で大きなリターンを狙う",
  },
  {
    code: "soros",
    name: "ソロス型（相場の読み師）",
    description: "マクロ経済の歪みを見抜き、大胆なポジションで利益を追求する",
  },
  {
    code: "graham",
    name: "グレアム型（堅実な分析家）",
    description: "財務データを徹底分析し、安全余裕度の高い銘柄に投資する",
  },
  {
    code: "oneill",
    name: "オニール型（モメンタム追従者）",
    description: "業績成長と株価の勢いを重視し、トレンドに乗る投資スタイル",
  },
  {
    code: "templeton",
    name: "テンプルトン型（逆張りの勇者）",
    description: "市場が悲観的な時に勇気を持って買い向かう、逆張り投資の達人",
  },
  {
    code: "bogle",
    name: "ボーグル型（インデックス信者）",
    description: "低コストのインデックス投資で市場平均を着実に積み上げる堅実派",
  },
  {
    code: "dalio",
    name: "ダリオ型（全天候型戦略家）",
    description: "分散投資とリスク管理を極め、あらゆる相場環境に備えるスタイル",
  },
];

export default function Page() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "投資家タイプ別ガイド",
    description:
      "8つの投資家タイプそれぞれに最適な学習ガイド。投資哲学・学習ステップ・推奨書籍を解説。",
    url: `${appUrl}/investor-guides`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: INVESTOR_TYPES.length,
      itemListElement: INVESTOR_TYPES.map((type, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${type.name}投資ガイド`,
        description: type.description,
      })),
    },
    isPartOf: {
      "@type": "WebSite",
      name: BRAND.NAME,
      url: appUrl,
    },
  };

  const breadcrumbItems = [
    { label: "ホーム", href: "/" },
    { label: "投資家ガイド" },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <Breadcrumbs
        items={breadcrumbItems}
        className="max-w-4xl mx-auto px-4 pt-4"
      />
      <InvestorGuidesListPage />
    </>
  );
}
