import Link from "next/link";
import { Typography } from "@/shared/ui/typography";
import type { RoadmapProgress } from "@/entities/roadmap";

interface RoadmapSummaryCardProps {
  progress: RoadmapProgress;
}

/**
 * ダッシュボード用のロードマップ要約カード（表示専用）。
 * 現在地・次の一歩・進捗を見せ、/roadmap へ誘導する。
 */
export function RoadmapSummaryCard({ progress }: RoadmapSummaryCardProps) {
  const total = progress.stages.length;
  const current = progress.stages.find((stage) => stage.status === "current");
  const percent = Math.round((progress.completedCount / total) * 100);

  return (
    <Link
      href="/roadmap"
      className="block rounded-2xl border border-(--border-primary) bg-surface-elevated p-5 transition hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <Typography variant="S_bold" className="text-brand-600">
          🗺️ 投資ロードマップ
        </Typography>
        <Typography variant="caution" className="text-(--text-tertiary)">
          {progress.completedCount}/{total} ステップ
        </Typography>
      </div>

      <Typography variant="L_bold" as="p" className="mt-1 text-foreground">
        {current?.label ?? "すべて完了"}
      </Typography>
      <Typography variant="S" className="mt-1 text-(--text-secondary)">
        → {progress.nextStep}
      </Typography>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-tertiary">
        <div
          className="h-full rounded-full bg-gradient-brand-horizontal"
          style={{ width: `${percent}%` }}
        />
      </div>
    </Link>
  );
}
