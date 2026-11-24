"use client"

import Image from "next/image"
import { cn } from "@/shared/lib/utils"
import { getLevelImagePath } from "../model/getLevelImagePath"
import { useState } from "react"

export interface LevelCharacterAvatarProps {
  level: number
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: { container: "w-10 h-10", dimension: 40 },
  md: { container: "w-16 h-16 md:w-20 md:h-20", dimension: 80 },
  lg: { container: "w-24 h-24", dimension: 96 },
}

export function LevelCharacterAvatar({ level, size = "md" }: LevelCharacterAvatarProps) {
  const [hasError, setHasError] = useState(false)
  const { container, dimension } = sizeMap[size]
  const imagePath = getLevelImagePath(level)

  if (hasError) {
    return (
      <div className={cn(
        container,
        "rounded-2xl flex items-center justify-center bg-gradient-brand"
      )}>
        <svg
          className="w-1/2 h-1/2 "
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
    )
  }

  return (
    <Image
      src={imagePath}
      alt={`レベル ${level}`}
      width={dimension}
      height={dimension}
      className={cn(container, "rounded-2xl shadow-sm object-cover")}
      onError={() => setHasError(true)}
      priority={size === "lg"}
    />
  )
}
