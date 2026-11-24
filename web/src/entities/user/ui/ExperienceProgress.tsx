"use client"

export interface ExperienceProgressProps {
  current: number
  max: number
  progress: number // 0-100
  showLabel?: boolean
}

export function ExperienceProgress({
  current,
  max,
  progress,
  showLabel = true,
}: ExperienceProgressProps) {
  return (
    <div className="flex-1">
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-(--text-secondary)">
            経験値
          </span>
          <span className="text-sm font-mono text-(--text-tertiary)">
            {current} / {max}
          </span>
        </div>
      )}
      <div className="h-3 rounded-full overflow-hidden bg-surface-tertiary">
        <div
          className="h-full transition-all duration-700 ease-out rounded-full bg-gradient-accent-horizontal"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
