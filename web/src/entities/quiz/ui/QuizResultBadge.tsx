"use client"

import { cn } from "@/shared/lib/utils"

export interface QuizResultBadgeProps {
  isCorrect: boolean
  size?: "sm" | "md"
}

const sizeMap = {
  sm: "w-5 h-5",
  md: "w-6 h-6",
}

const iconSizeMap = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
}

export function QuizResultBadge({ isCorrect, size = "sm" }: QuizResultBadgeProps) {
  const containerSize = sizeMap[size]
  const iconSize = iconSizeMap[size]

  return (
    <div
      className={cn(
        containerSize,
        "rounded flex items-center justify-center",
        isCorrect ? "bg-positive-100" : "bg-negative-100"
      )}
    >
      {isCorrect ? (
        <svg
          className={cn(iconSize, "text-positive-600")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <svg
          className={cn(iconSize, "text-negative-600")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      )}
    </div>
  )
}
