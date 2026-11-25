import type { Metadata } from "next";
import { GlossaryListPage } from "@/views/glossary";
import { BRAND } from "@/shared/config";
import { serializeJsonLd } from "@/shared/lib/json-ld";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "投資用語辞典 | 初心者向けにわかりやすく解説",
  description:
    "PER・PBR・配当利回り・ROEなど、株式投資で頻出する用語を初心者向けにわかりやすく解説。具体例付きで投資の基礎知識を身につけましょう。",
  keywords: [
    "投資用語",
    "株式用語 辞典",
    "PER とは",
    "PBR とは",
    "配当利回り 意味",
    "ROE とは",
    "投資 初心者 用語",
    "株式投資 基礎知識",
    "投資用語 一覧",
  ],
  openGraph: {
    title: "投資用語辞典 | 初心者向けにわかりやすく解説",
    description:
      "株式投資で頻出する用語を初心者向けにわかりやすく解説。具体例付きで基礎知識を身につけましょう。",
    type: "website",
    locale: "ja_JP",
    url: "/glossary",
    siteName: BRAND.NAME,
  },
  twitter: { card: "summary" },
  alternates: { canonical: "/glossary" },
  robots: { index: true, follow: true },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": ["CollectionPage", "LearningResource"],
  name: "投資用語辞典｜初心者向けにわかりやすく解説",
  description:
    "PER・PBR・配当利回りなど、株式投資で頻出する用語を初心者向けに解説",
  learningResourceType: "用語辞典",
  educationalLevel: "初心者",
  teaches: "投資用語の理解、基礎知識の習得",
  inLanguage: "ja",
  isAccessibleForFree: true,
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <GlossaryListPage />
    </>
  );
}
