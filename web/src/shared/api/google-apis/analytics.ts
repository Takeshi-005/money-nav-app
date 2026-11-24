import "server-only";
import { GoogleAuth } from "google-auth-library";
import type { PagePerformanceRow } from "@/shared/api/seo/types";

const GA4_API = "https://analyticsdata.googleapis.com/v1beta";

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
});

type GA4Row = {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
};

type GA4Response = {
  rows?: GA4Row[];
};

export async function fetchPagePerformance(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<PagePerformanceRow[]> {
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;

  const url = `${GA4_API}/properties/${propertyId}:runReport`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "totalUsers" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
      ],
      limit: 1000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GA4 Data API error: ${response.status} ${errorBody}`);
  }

  const data: GA4Response = await response.json();

  if (!data.rows) {
    return [];
  }

  return data.rows.map((row) => ({
    pagePath: row.dimensionValues[0].value,
    pageViews: parseInt(row.metricValues[0].value, 10),
    uniqueUsers: parseInt(row.metricValues[1].value, 10),
    avgEngagementTime: parseFloat(row.metricValues[2].value),
    bounceRate: parseFloat(row.metricValues[3].value),
  }));
}
