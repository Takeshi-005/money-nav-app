/**
 * Quiz History Header Widget
 * クイズ履歴ページのヘッダー
 */

import Link from "next/link"
import { Typography } from "@/shared/ui/typography"

export function QuizHistoryHeader() {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Link
        href="/dashboard"
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 bg-surface-secondary border border-(--border-primary)"
      >
        <svg
          className="w-5 h-5 text-(--text-secondary)"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </Link>
      <Typography variant="title_S" as="h1" className="text-foreground tracking-tighter">
        学習履歴
      </Typography>
    </div>
  )
}
