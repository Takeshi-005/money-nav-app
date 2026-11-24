import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import type { UserPerformance } from "@/entities/prediction";

interface PerformanceStatsProps {
  performance: UserPerformance;
  isGuest: boolean;
}

export function PerformanceStats({ performance, isGuest }: PerformanceStatsProps) {
  if (isGuest) {
    return (
      <div className="rounded-2xl bg-surface-secondary p-6 text-center space-y-2">
        <Typography variant="M_bold">📊 成績を記録しよう</Typography>
        <Typography variant="S" className="text-(--text-secondary)">
          ログインすると的中率・連勝数が記録されます
        </Typography>
      </div>
    );
  }

  const winRatePct = Math.round(performance.winRate * 100);

  return (
    <div className="rounded-2xl bg-surface-secondary p-6 space-y-4">
      <Typography variant="title_SS">📊 あなたの成績</Typography>

      <div className="grid grid-cols-2 gap-3">
        <StatItem
          label="的中率"
          value={`${winRatePct}%`}
          sub={`${performance.correctPredictions}/${performance.totalPredictions}問`}
          valueClass={winRatePct >= 50 ? "text-positive-600" : "text-negative-600"}
        />
        <StatItem
          label="連勝"
          value={`${performance.currentStreak}連勝`}
          sub={`最高 ${performance.maxStreak}連勝`}
          valueClass="text-brand-500"
        />
      </div>

      {performance.totalPredictions === 0 && (
        <Typography variant="caution" className="text-center text-(--text-secondary)">
          予測を始めると成績が記録されます
        </Typography>
      )}
    </div>
  );
}

function StatItem({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub: string;
  valueClass: string;
}) {
  return (
    <div className="bg-surface-elevated rounded-xl p-3 text-center space-y-1">
      <Typography variant="caution" className="text-(--text-secondary)">
        {label}
      </Typography>
      <Typography variant="M_bold" className={cn(valueClass)}>
        {value}
      </Typography>
      <Typography variant="caution" className="text-(--text-secondary)">
        {sub}
      </Typography>
    </div>
  );
}
