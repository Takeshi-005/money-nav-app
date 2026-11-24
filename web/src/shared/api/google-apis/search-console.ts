import "server-only";
import { GoogleAuth } from "google-auth-library";
import type { SearchPerformanceRow } from "@/shared/api/seo/types";

const SEARCH_CONSOLE_API =
  "https://www.googleapis.com/webmasters/v3/sites";

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
});

type SearchAnalyticsRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type SearchAnalyticsResponse = {
  rows?: SearchAnalyticsRow[];
};

export async function fetchSearchPerformance(
  siteUrl: string,
  startDate: string,
  endDate: string,
): Promise<SearchPerformanceRow[]> {
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;

  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const url = `${SEARCH_CONSOLE_API}/${encodedSiteUrl}/searchAnalytics/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["query", "page"],
      rowLimit: 1000,
      dataState: "final",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Search Console API error: ${response.status} ${errorBody}`,
    );
  }

  const data: SearchAnalyticsResponse = await response.json();

  if (!data.rows) {
    return [];
  }

  return data.rows.map((row) => ({
    query: row.keys[0],
    page: row.keys[1],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }));
}
