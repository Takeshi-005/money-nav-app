import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { Typography } from "@/shared/ui/typography";
import type { DisclosureImpactResponse } from "@/features/disclosure-impact-data";
import { queryKeys } from "@/shared/api/query-client";
import {
  getAvailableDates,
  getDatesWithImpactAnalyses,
  getImpactStocksByDate,
} from "../lib";
import { TomorrowImpactPageClient } from "./TomorrowImpactPageClient";
import { TomorrowImpactStructuredData } from "./TomorrowImpactStructuredData";
import { TomorrowImpactDateLinks } from "./TomorrowImpactDateLinks";

const DATE_LINKS_LIMIT = 30;

export async function TomorrowImpactPage() {
  const availableDates = await getAvailableDates();
  const latestDate = availableDates[0] ?? "";
  const { stocks: latestStocks, latestCreatedAt } =
    await getImpactStocksByDate(latestDate);

  const queryClient = new QueryClient();
  if (latestDate) {
    const seedResponse: DisclosureImpactResponse = {
      date: latestDate,
      stocks: latestStocks,
    };
    queryClient.setQueryData(
      queryKeys.disclosureImpact.byDate(latestDate),
      seedResponse,
    );
  }

  const archiveDates = await getDatesWithImpactAnalyses(DATE_LINKS_LIMIT);

  return (
    <>
      <TomorrowImpactStructuredData
        latestDate={latestDate}
        stocks={latestStocks}
        latestCreatedAt={latestCreatedAt}
      />
      <main id="main-content" className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 rounded-full bg-gradient-brand" />
            <Typography variant="title_S" as="h1">
              明日の好悪材料分析
            </Typography>
          </div>
          <Typography variant="S" className="text-(--text-secondary)">
            この一覧は適時開示情報を扱う公開記事から、翌営業日の相場材料になりうる銘柄を
            AI
            が分類・解説したものです。上場全銘柄の網羅ではなく、編集による選別が入っています。
          </Typography>
          <Typography variant="caution" className="text-(--text-tertiary)">
            ※ AI による分析です。投資推奨ではありません。
          </Typography>
        </header>
        {latestDate ? (
          <>
            <HydrationBoundary state={dehydrate(queryClient)}>
              <TomorrowImpactPageClient
                availableDates={availableDates}
                latestDate={latestDate}
              />
            </HydrationBoundary>
            <TomorrowImpactDateLinks dates={archiveDates} />
          </>
        ) : (
          <div className="p-5 rounded-xl bg-surface-secondary border border-(--border-primary) text-center">
            <Typography variant="S" className="text-(--text-secondary)">
              まだ取り込みデータがありません
            </Typography>
          </div>
        )}
      </main>
    </>
  );
}
