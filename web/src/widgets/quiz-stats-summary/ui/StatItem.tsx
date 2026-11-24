/**
 * Quiz Stats Summary Widget - StatItem
 * 統計項目コンポーネント
 */
import { cn } from "@/shared/lib/utils"

export interface StatItemProps {
  value: number
  label: string
  colorClass?: string
}

export function StatItem({ value, label, colorClass = "text-foreground" }: StatItemProps) {
  return (
    <div className="text-center">
      <div className={cn("text-3xl font-bold font-mono", colorClass)}>
        {value}
      </div>
      <div className="text-xs mt-1 text-(--text-tertiary)">
        {label}
      </div>
    </div>
  )
}
