import type { MarketImpact, MarketImpactEntry } from "@/types/supabase";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";

interface Props {
  marketImpact: MarketImpact;
}

const DIRECTION_CONFIG = {
  positive: {
    icon: "↑",
    label: "上昇圧力",
    textClass: "text-positive-600",
    bgClass: "bg-positive-50",
    badgeClass: "bg-positive-100 text-positive-700",
  },
  negative: {
    icon: "↓",
    label: "下落圧力",
    textClass: "text-negative-600",
    bgClass: "bg-negative-50",
    badgeClass: "bg-negative-100 text-negative-700",
  },
  neutral: {
    icon: "→",
    label: "中立",
    textClass: "text-(--text-secondary)",
    bgClass: "bg-surface-tertiary",
    badgeClass: "bg-surface-tertiary text-(--text-secondary)",
  },
} as const;

const MAGNITUDE_LABEL = {
  large: "大",
  medium: "中",
  small: "小",
} as const;

function IndexImpactRow({
  label,
  entry,
}: {
  label: string;
  entry: MarketImpactEntry;
}) {
  const config = DIRECTION_CONFIG[entry.direction];

  return (
    <div className={cn("p-4 rounded-xl", config.bgClass)}>
      <div className="flex items-center justify-between mb-2">
        <Typography variant="S_bold" className="text-foreground">
          {label}
        </Typography>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              config.badgeClass,
            )}
          >
            影響度 {MAGNITUDE_LABEL[entry.magnitude]}
          </span>
          <span className={cn("text-lg font-bold", config.textClass)}>
            {config.icon} {config.label}
          </span>
        </div>
      </div>
      <Typography variant="S_bold" className="text-foreground mb-1">
        {entry.summary}
      </Typography>
      <Typography variant="S" className="text-(--text-secondary) leading-relaxed">
        {entry.reason}
      </Typography>
    </div>
  );
}

export function MarketImpactSection({ marketImpact }: Props) {
  return (
    <div className="mt-6 p-5 rounded-2xl bg-surface-secondary border border-(--border-primary)">
      <Typography variant="S_bold" className="text-foreground mb-4">
        📊 市場への影響分析
      </Typography>

      <div className="space-y-3 mb-4">
        <IndexImpactRow label="日経平均" entry={marketImpact.nikkeiImpact} />
        <IndexImpactRow label="TOPIX" entry={marketImpact.topixImpact} />
      </div>

      {marketImpact.affectedSectors.length > 0 && (
        <div className="mb-4">
          <Typography variant="caution" className="text-(--text-tertiary) mb-2">
            影響を受けるセクター
          </Typography>
          <div className="flex flex-wrap gap-2">
            {marketImpact.affectedSectors.map((sector, i) => {
              const config = DIRECTION_CONFIG[sector.impact];
              return (
                <span
                  key={i}
                  title={sector.reason}
                  className={cn(
                    "text-xs font-medium px-3 py-1 rounded-full",
                    config.badgeClass,
                  )}
                >
                  {config.icon} {sector.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="p-3 rounded-xl bg-brand-50 border border-brand-100">
        <Typography variant="caution" className="text-brand-600 font-semibold mb-1">
          💡 初心者向け解説
        </Typography>
        <Typography variant="caution" className="text-(--text-secondary) leading-relaxed">
          {marketImpact.educationalNote}
        </Typography>
      </div>
    </div>
  );
}
