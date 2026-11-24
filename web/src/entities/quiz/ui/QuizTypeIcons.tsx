"use client"

import type { QuizType } from "../model/types"
import { cn } from "@/shared/lib/utils"

export interface QuizTypeIconProps {
  type: QuizType
  size?: "sm" | "md"
  showBackground?: boolean
}

const iconPaths: Record<QuizType, React.ReactNode> = {
  news: (
    <>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </>
  ),
  basic: <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />,
  scenario: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  psychology: (
    <>
      <path d="M9.5 2A7.5 7.5 0 0 1 17 9.5c0 1.75-.6 3.36-1.61 4.63" />
      <path d="M17 9.5A7.5 7.5 0 1 1 9.5 2" />
      <circle cx="12" cy="11" r="1" />
      <path d="M12 12v6" />
      <path d="M9 15h6" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </>
  ),
}

const titles: Record<QuizType, string> = {
  news: "時事",
  basic: "基本",
  scenario: "シナリオ",
  psychology: "心理",
  history: "歴史",
}

const sizeMap = {
  sm: { container: "w-8 h-8", icon: "w-4 h-4" },
  md: { container: "w-10 h-10", icon: "w-5 h-5" },
}

export function QuizTypeIcon({ type, size = "md", showBackground = true }: QuizTypeIconProps) {
  const { container, icon } = sizeMap[size]

  if (!showBackground) {
    return (
      <svg
        className={cn(icon, "text-(--text-secondary)")}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        {iconPaths[type]}
      </svg>
    )
  }

  return (
    <div
      className={cn(container, "rounded-xl flex items-center justify-center bg-surface-tertiary")}
      title={titles[type]}
    >
      <svg
        className={cn(icon, "text-(--text-secondary)")}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        {iconPaths[type]}
      </svg>
    </div>
  )
}

export interface QuizTypeIconsGroupProps {
  size?: "sm" | "md"
}

export function QuizTypeIconsGroup({ size = "md" }: QuizTypeIconsGroupProps) {
  return (
    <div className="flex items-center gap-3">
      <QuizTypeIcon type="news" size={size} />
      <QuizTypeIcon type="basic" size={size} />
      <QuizTypeIcon type="scenario" size={size} />
    </div>
  )
}
