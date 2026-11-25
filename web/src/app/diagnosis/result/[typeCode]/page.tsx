import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { InvestorTypeCode } from "@/types/supabase";
import {
  INVESTOR_TYPE_DATA,
  INVESTOR_TYPE_CODES,
  InvestorAvatar,
} from "@/entities/diagnosis";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import { buildBreadcrumbList } from "@/shared/lib/structured-data";
import { BRAND } from "@/shared/config";
import { serializeJsonLd } from "@/shared/lib/json-ld";

interface Props {
  params: Promise<{ typeCode: string }>;
}

export function generateStaticParams() {
  return INVESTOR_TYPE_CODES.map((typeCode) => ({ typeCode: typeCode.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { typeCode } = await params;
  const code = typeCode.toUpperCase() as InvestorTypeCode;
  const data = INVESTOR_TYPE_DATA[code];
  if (!data) {return {};}

  return {
    title: `${data.name}（${data.subtitle}）| AI投資スタイル診断`,
    description: data.description,
    openGraph: {
      title: `あなたは「${data.name}」タイプ！`,
      description: data.description,
      type: "website",
      locale: "ja_JP",
      url: `/diagnosis/result/${typeCode}`,
      siteName: BRAND.NAME,
    },
    twitter: {
      card: "summary_large_image",
    },
    alternates: {
      canonical: `/diagnosis/result/${typeCode}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function DiagnosisResultPage({ params }: Props) {
  const { typeCode } = await params;
  const code = typeCode.toUpperCase() as InvestorTypeCode;
  const data = INVESTOR_TYPE_DATA[code];

  if (!data) {notFound();}

  const learningResourceData = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: `${data.name}（${data.subtitle}）`,
    description: data.description,
    educationalLevel: "初心者",
    inLanguage: "ja",
    isAccessibleForFree: true,
    learningResourceType: "投資家タイプ診断結果",
    teaches: data.keyTraits.join(", "),
  };

  const breadcrumbData = buildBreadcrumbList([
    { name: "ホーム", path: "/" },
    { name: "AI投資スタイル診断", path: "/diagnosis" },
    { name: data.name },
  ]);

  return (
    <div className="min-h-screen py-12 px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(learningResourceData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbData) }}
      />
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <InvestorAvatar typeCode={code} investorType={data.name} size="lg" />
          <Typography variant="title_S" className="mt-6 mb-1">
            {data.name}
          </Typography>
          <Typography variant="M" className="text-(--text-secondary)">
            {data.subtitle}
          </Typography>
        </div>

        <div className="p-6 rounded-3xl mb-6 bg-surface-secondary border border-(--border-primary)">
          <Typography variant="M" className="leading-relaxed text-(--text-secondary)">
            {data.description}
          </Typography>
        </div>

        <div className="p-6 rounded-3xl mb-6 bg-surface-secondary border border-(--border-primary)">
          <Typography variant="S_bold" className="mb-4 text-brand-500">
            このタイプの特徴
          </Typography>
          <ul className="space-y-3">
            {data.keyTraits.map((trait) => (
              <li key={trait} className="flex items-start gap-3">
                <span className="mt-0.5 text-brand-500 shrink-0">✓</span>
                <Typography variant="S" className="text-(--text-secondary)">
                  {trait}
                </Typography>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 rounded-2xl mb-8 bg-brand-50 border border-brand-100">
          <Typography variant="S" className="text-brand-700">
            💡 {data.bestFor}
          </Typography>
        </div>

        <div className="text-center space-y-4">
          <Link
            href="/diagnosis?start=true"
            className={cn(
              "inline-block w-full py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-[1.02]",
              "bg-gradient-brand text-white",
            )}
          >
            あなたのタイプを診断する（無料・登録不要）
          </Link>
          <Link
            href="/quiz"
            className="inline-block w-full py-3 rounded-2xl font-medium transition-colors bg-surface-secondary border border-(--border-primary) text-(--text-secondary) hover:bg-surface-tertiary"
          >
            今日のクイズに挑戦する
          </Link>
        </div>
      </div>
    </div>
  );
}
