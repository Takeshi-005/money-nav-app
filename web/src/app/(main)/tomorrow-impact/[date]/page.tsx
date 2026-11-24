import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  TomorrowImpactDatePage,
  getDatesWithImpactAnalyses,
} from "@/views/tomorrow-impact";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { BRAND, buildPageTitle } from "@/shared/config";
import {
  isValidDate,
  isNotFutureDate,
  formatDateJapanese,
  formatMonthDayJP,
} from "@/shared/lib/date";

export const revalidate = 86400;
export const dynamicParams = true;

const STATIC_PARAMS_LIMIT = 60;

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;

  if (!isValidDate(date) || !isNotFutureDate(date)) {
    return { title: "不正なURLです" };
  }

  const dateLabel = formatDateJapanese(date);
  const title = `${dateLabel}の好悪材料分析｜適時開示から学ぶ翌営業日の相場材料`;
  const description = `${dateLabel}発表の適時開示を AI が好材料・悪材料に分類し、初心者向けに解説します。翌営業日の相場材料を学習しながら把握できます。`;

  return {
    title,
    description,
    keywords: [
      "適時開示",
      "好材料",
      "悪材料",
      "翌営業日",
      `${formatMonthDayJP(date)} 好材料`,
      "株式投資 学習",
      "上方修正",
      "自社株買い",
    ],
    openGraph: {
      title: buildPageTitle(title),
      description,
      type: "article",
      publishedTime: `${date}T07:00:00+09:00`,
      locale: "ja_JP",
      url: `/tomorrow-impact/${date}`,
      siteName: BRAND.NAME,
    },
    twitter: {
      card: "summary",
      title: buildPageTitle(title),
      description,
    },
    alternates: { canonical: `/tomorrow-impact/${date}` },
    robots: { index: true, follow: true },
  };
}

export async function generateStaticParams() {
  const dates = await getDatesWithImpactAnalyses(STATIC_PARAMS_LIMIT);
  return dates.map((date) => ({ date }));
}

export default async function Page({ params }: Props) {
  const { date } = await params;

  if (!isValidDate(date) || !isNotFutureDate(date)) {
    notFound();
  }

  const breadcrumbItems = [
    { label: "ホーム", href: "/" },
    { label: "明日の好悪材料分析", href: "/tomorrow-impact" },
    { label: `${formatMonthDayJP(date)}` },
  ];

  return (
    <>
      <Breadcrumbs
        items={breadcrumbItems}
        className="max-w-3xl mx-auto px-4 pt-4"
      />
      <TomorrowImpactDatePage date={date} />
    </>
  );
}
