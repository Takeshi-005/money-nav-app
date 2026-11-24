"use client";

import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import type { PreviewEvent } from "../model/types";

type StatTone = "default" | "positive" | "warning" | "muted" | "negative";

export function StatBox({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: StatTone;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-xl border",
        tone === "positive" && "bg-positive-50 border-positive-200",
        tone === "warning" && "bg-accent-50 border-accent-200",
        tone === "negative" && "bg-negative-50 border-negative-200",
        tone === "muted" && "bg-surface-tertiary border-(--border-primary)",
        tone === "default" && "bg-surface-secondary border-(--border-primary)",
      )}
    >
      <Typography variant="caution" className="text-(--text-secondary)">
        {label}
      </Typography>
      <Typography
        variant="price"
        className={cn(
          tone === "positive" && "text-positive-700",
          tone === "warning" && "text-accent-700",
          tone === "negative" && "text-negative-700",
          tone === "muted" && "text-(--text-tertiary)",
        )}
      >
        {value}
      </Typography>
    </div>
  );
}

export function DistBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "positive" | "negative" | "muted";
}) {
  return (
    <div
      className={cn(
        "px-2 py-1 rounded-lg border text-center",
        tone === "positive" && "bg-positive-50 border-positive-200 text-positive-700",
        tone === "negative" && "bg-negative-50 border-negative-200 text-negative-700",
        tone === "muted" && "bg-surface-tertiary border-(--border-primary) text-(--text-tertiary)",
        !tone && "bg-surface-secondary border-(--border-primary)",
      )}
    >
      <Typography variant="caution">{label}</Typography>
      <Typography variant="S_bold">{value}</Typography>
    </div>
  );
}

export function ImpactBadge({ impact }: { impact: PreviewEvent["impact"] }) {
  const label =
    impact === "positive" ? "好材料" : impact === "negative" ? "悪材料" : "中立";
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium",
        impact === "positive" && "bg-positive-100 text-positive-700",
        impact === "negative" && "bg-negative-100 text-negative-700",
        impact === "neutral" && "bg-surface-tertiary text-(--text-tertiary)",
      )}
    >
      {label}
    </span>
  );
}

export function MagnitudeBadge({
  magnitude,
}: {
  magnitude: PreviewEvent["magnitude"];
}) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs bg-surface-secondary text-(--text-secondary) border border-(--border-primary)">
      {magnitude}
    </span>
  );
}

export function RelevanceBadge({ value }: { value: number }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs bg-brand-100 text-brand-700">
      関連度 {value.toFixed(1)}
    </span>
  );
}
