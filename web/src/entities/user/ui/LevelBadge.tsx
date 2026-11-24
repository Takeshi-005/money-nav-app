"use client"

import { cn } from "@/shared/lib/utils"

export interface LevelBadgeProps {
  level: number
  variant?: "default" | "accent"
}

export function LevelBadge({ level, variant = "accent" }: LevelBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-14 h-14 rounded-xl font-bold text-lg",
        variant === "accent"
          ? "bg-gradient-accent  shadow-glow-accent"
          : "bg-surface-tertiary text-foreground"
      )}
    >
      Lv.{level}
    </div>
  )
}
