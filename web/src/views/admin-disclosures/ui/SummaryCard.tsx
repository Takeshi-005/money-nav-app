"use client";

import { Typography } from "@/shared/ui/typography";
import { DistBadge, StatBox } from "./badges";
import type { PreviewResponse, PreviewSummary } from "../model/types";

export function SummaryCard({
  articleDate,
  sourceUrl,
  summary,
  duplicate,
}: {
  articleDate: string;
  sourceUrl: string | null;
  summary: PreviewSummary;
  duplicate: PreviewResponse["duplicate"];
}) {
  const { distribution } = summary;
  return (
    <div className="p-5 rounded-2xl bg-surface-elevated border border-(--border-primary) space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <Typography variant="M_bold">プレビュー</Typography>
        <Typography variant="caution" className="text-(--text-tertiary)">
          記事日付: {articleDate}
        </Typography>
      </div>
      {sourceUrl && (
        <Typography variant="caution" className="text-(--text-secondary)">
          参照URL: {sourceUrl}
        </Typography>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox
          label="Top5 採用"
          value={summary.totalEvents}
          tone="positive"
        />
        <StatBox
          label="重要度低で除外"
          value={summary.droppedCount}
          tone="muted"
        />
        <StatBox
          label="未登録銘柄"
          value={summary.unwatchedCount}
          tone={summary.unwatchedCount > 0 ? "warning" : "muted"}
        />
        <StatBox
          label="重複"
          value={duplicate ? 1 : 0}
          tone={duplicate ? "negative" : "muted"}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center">
        <DistBadge
          label="positive"
          value={distribution.impact.positive}
          tone="positive"
        />
        <DistBadge
          label="negative"
          value={distribution.impact.negative}
          tone="negative"
        />
        <DistBadge
          label="neutral"
          value={distribution.impact.neutral}
          tone="muted"
        />
        <DistBadge label="large" value={distribution.magnitude.large} />
        <DistBadge label="medium" value={distribution.magnitude.medium} />
        <DistBadge label="small" value={distribution.magnitude.small} />
      </div>
    </div>
  );
}
