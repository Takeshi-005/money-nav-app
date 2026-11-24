import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { DisclosureImpactCard } from "@/widgets/disclosure-impact-card";
import { Typography } from "@/shared/ui/typography";
import type { DisclosureImpactResponse } from "@/features/disclosure-impact-data";
import { queryKeys } from "@/shared/api/query-client";
import { NAVIGATION_PATHS } from "@/shared/config";
import { formatDateJapanese } from "@/shared/lib/date";
import { getDatesWithImpactAnalyses, getImpactStocksByDate } from "../lib";
import { TomorrowImpactStructuredData } from "./TomorrowImpactStructuredData";
import { TomorrowImpactDateLinks } from "./TomorrowImpactDateLinks";

const DATE_LINKS_LIMIT = 30;

interface Props {
  date: string;
}

export async function TomorrowImpactDatePage({ date }: Props) {
  const { stocks, latestCreatedAt } = await getImpactStocksByDate(date);

  if (stocks.length === 0) {
    notFound();
  }

  const recentDates = await getDatesWithImpactAnalyses(DATE_LINKS_LIMIT);

  const queryClient = new QueryClient();
  const seedResponse: DisclosureImpactResponse = { date, stocks };
  queryClient.setQueryData(
    queryKeys.disclosureImpact.byDate(date),
    seedResponse,
  );

  const dateLabel = formatDateJapanese(date);
  const pageName = `${dateLabel}の好悪材料分析`;

  return (
    <>
      <TomorrowImpactStructuredData
        latestDate={date}
        stocks={stocks}
        latestCreatedAt={latestCreatedAt}
        pagePath={`${NAVIGATION_PATHS.TOMORROW_IMPACT}/${date}`}
        pageName={pageName}
      />
      <main id="main-content" className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 rounded-full bg-gradient-brand" />
            <Typography variant="title_S" as="h1">
              {dateLabel}の好悪材料分析
            </Typography>
          </div>
          <Typography variant="S" className="text-(--text-secondary)">
            {dateLabel}発表の適時開示から、翌営業日の相場材料になりうる銘柄を AI
            が分類・解説しています。上場全銘柄の網羅ではなく、編集による選別が入っています。
          </Typography>
          <Typography variant="caution" className="text-(--text-tertiary)">
            ※ AI による分析です。投資推奨ではありません。
          </Typography>
        </header>

        <TomorrowImpactDateLinks dates={recentDates} currentDate={date} />

        <HydrationBoundary state={dehydrate(queryClient)}>
          <DisclosureImpactCard date={date} />
        </HydrationBoundary>

        <div className="pt-2">
          <Link
            href={NAVIGATION_PATHS.TOMORROW_IMPACT}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            ← 最新の好悪材料分析を見る
          </Link>
        </div>
      </main>
    </>
  );
}
