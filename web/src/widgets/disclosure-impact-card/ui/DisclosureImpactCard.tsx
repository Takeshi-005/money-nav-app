"use client";

import {
  useDisclosureImpact,
  type DisclosureImpactAnalysis,
} from "@/features/disclosure-impact-data";
import { Typography } from "@/shared/ui/typography";
import { DisclosureImpactItem } from "./DisclosureImpactItem";

interface Props {
  date: string;
}

const SECTION_CONFIG = {
  positive: { emoji: "🟢", label: "好材料" },
  negative: { emoji: "🔴", label: "悪材料" },
  neutral: { emoji: "⚪", label: "中立" },
} as const;

const SECTION_ORDER = ["positive", "negative", "neutral"] as const;

export function DisclosureImpactCard({ date }: Props) {
  const { data, isLoading, error } = useDisclosureImpact(date);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-surface-tertiary animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-xl bg-surface-secondary border border-(--border-primary) text-center">
        <Typography variant="S" className="text-(--text-secondary)">
          データの取得に失敗しました
        </Typography>
      </div>
    );
  }

  const stocks = data?.stocks ?? [];

  if (stocks.length === 0) {
    return (
      <div className="p-5 rounded-xl bg-surface-secondary border border-(--border-primary) text-center">
        <Typography variant="S" className="text-(--text-secondary)">
          本日の取り込みはありません
        </Typography>
      </div>
    );
  }

  const grouped: Record<
    DisclosureImpactAnalysis["impact"],
    DisclosureImpactAnalysis[]
  > = { positive: [], negative: [], neutral: [] };
  for (const stock of stocks) {
    grouped[stock.impact].push(stock);
  }

  return (
    <div className="space-y-6">
      {SECTION_ORDER.map((impact) => {
        const items = grouped[impact];
        if (items.length === 0) {
          return null;
        }
        const config = SECTION_CONFIG[impact];
        return (
          <section key={impact} className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary border border-(--border-primary)">
              <Typography variant="M_bold" as="h2">
                {config.emoji} {config.label}
              </Typography>
              <Typography variant="caution" className="text-(--text-tertiary)">
                {items.length}件
              </Typography>
            </div>
            <div className="space-y-3">
              {items.map((stock) => (
                <DisclosureImpactItem
                  key={stock.ticker_code}
                  stock={stock}
                  date={date}
                />
              ))}
            </div>
          </section>
        );
      })}
      <Typography variant="caution" className="text-(--text-tertiary) mt-3">
        ※ AI による分析です。投資判断は自己責任でお願いします。
      </Typography>
    </div>
  );
}
