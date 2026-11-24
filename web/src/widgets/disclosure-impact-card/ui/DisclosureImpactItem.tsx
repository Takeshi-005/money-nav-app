"use client";

import Link from "next/link";
import type { DisclosureImpactAnalysis } from "@/features/disclosure-impact-data";
import { DISCLOSURE_TYPE_LABELS } from "@/shared/api/gemini/disclosure-extraction";
import { splitByEnumMarkers } from "@/entities/disclosure";
import { NAVIGATION_BUILDERS } from "@/shared/config";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";

const DIRECTION_CONFIG = {
  positive: {
    icon: "📈",
    label: "好材料",
    textClass: "text-positive-600",
    badgeClass: "bg-positive-100 text-positive-700",
  },
  negative: {
    icon: "📉",
    label: "悪材料",
    textClass: "text-negative-600",
    badgeClass: "bg-negative-100 text-negative-700",
  },
  neutral: {
    icon: "➖",
    label: "中立",
    textClass: "text-(--text-secondary)",
    badgeClass: "bg-surface-tertiary text-(--text-secondary)",
  },
} as const;

const MAGNITUDE_LABEL = {
  large: "業績インパクト大",
  medium: "業績インパクト中",
  small: "業績インパクト小",
} as const;

interface Props {
  stock: DisclosureImpactAnalysis;
  /** 指定時はイベント個別ページ（/tomorrow-impact/[date]/[ticker]）への導線を表示 */
  date?: string;
}

export function DisclosureImpactItem({ stock, date }: Props) {
  const config = DIRECTION_CONFIG[stock.impact];

  return (
    <article
      id={`stock-${stock.ticker_code}`}
      className="p-4 rounded-xl bg-surface-secondary border border-(--border-primary) scroll-mt-20"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <Typography variant="S_bold" className="text-foreground">
            {stock.company_name}
          </Typography>
          <Typography
            variant="caution"
            className="text-(--text-tertiary) font-mono"
          >
            {stock.ticker_code}
          </Typography>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
            {DISCLOSURE_TYPE_LABELS[stock.disclosure_type]}
          </span>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              config.badgeClass,
            )}
          >
            {MAGNITUDE_LABEL[stock.magnitude]}
          </span>
          <span className={cn("text-sm font-bold", config.textClass)}>
            {config.icon} {config.label}
          </span>
        </div>
      </div>

      {stock.key_concept && (
        <div className="mb-3 p-3 rounded-lg bg-accent-50 border border-accent-200">
          <Typography
            variant="caution"
            className="text-accent-700 font-medium mb-1"
          >
            🎯 今日学べる概念
          </Typography>
          <Typography variant="S_bold" className="text-accent-900">
            {stock.key_concept}
          </Typography>
        </div>
      )}

      {stock.educational_note && (
        <div className="p-3 rounded-lg bg-brand-50 border border-brand-100">
          <Typography
            variant="caution"
            className="text-brand-700 font-medium mb-2"
          >
            💡 詳しく解説
          </Typography>
          <div className="space-y-2">
            {splitByEnumMarkers(stock.educational_note).map((part, i) => (
              <Typography
                key={i}
                variant="S"
                className="text-brand-700 leading-relaxed"
              >
                {part}
              </Typography>
            ))}
          </div>
        </div>
      )}

      {date && (
        <div className="mt-3 text-right">
          <Link
            href={NAVIGATION_BUILDERS.tomorrowImpactEventDetail(
              date,
              stock.ticker_code,
            )}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            {stock.company_name}の{DISCLOSURE_TYPE_LABELS[stock.disclosure_type]}
            をくわしく見る →
          </Link>
        </div>
      )}
    </article>
  );
}
