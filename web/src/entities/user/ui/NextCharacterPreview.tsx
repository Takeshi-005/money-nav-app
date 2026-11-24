"use client"

import { cn } from "@/shared/lib/utils"
import type { CharacterMilestone } from "../model/getNextCharacterMilestone"

export interface NextCharacterPreviewProps {
  milestone: CharacterMilestone | null
}

export function NextCharacterPreview({ milestone }: NextCharacterPreviewProps) {
  if (!milestone) {
    return null
  }

  return (
    <div className={cn(
      "mt-4 p-4 rounded-xl",
      "bg-surface-tertiary border border-(--border-primary)"
    )}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🎯</span>
        <p className="text-sm font-medium text-foreground">
          Lv.{milestone.level} で新キャラクター登場！
        </p>
      </div>
      <p className="text-xs text-(--text-secondary) ml-7">
        あと <span className="font-semibold text-brand-500">{milestone.remainingExp.toLocaleString()}</span> EXP
      </p>
    </div>
  )
}
