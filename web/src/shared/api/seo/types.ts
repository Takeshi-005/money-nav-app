export type SearchPerformanceRow = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type PagePerformanceRow = {
  pagePath: string;
  pageViews: number;
  uniqueUsers: number;
  avgEngagementTime: number;
  bounceRate: number;
};

export type InsightType =
  | "low_ctr"
  | "position_improvement"
  | "content_gap"
  | "top_performer";

export type InsightStatus =
  | "new"
  | "in_progress"
  | "completed"
  | "dismissed";

export type SeoInsight = {
  insightType: InsightType;
  priority: number;
  title: string;
  description: string;
  targetQuery: string | null;
  targetPage: string | null;
  currentMetrics: Record<string, number>;
  suggestedAction: string;
};

export type InsightMetrics = Record<string, number>;

export type InsightFollowupResult = {
  insightId: string;
  targetQuery: string | null;
  targetPage: string | null;
  actionTaken: string;
  baselineMetrics: InsightMetrics;
  followupMetrics: InsightMetrics;
  improvementSummary: string;
};

export type WeeklySummary = {
  totalClicks: number;
  totalImpressions: number;
  avgCtr: number;
  avgPosition: number;
  prevTotalClicks: number | null;
  prevTotalImpressions: number | null;
  prevAvgCtr: number | null;
  prevAvgPosition: number | null;
};
