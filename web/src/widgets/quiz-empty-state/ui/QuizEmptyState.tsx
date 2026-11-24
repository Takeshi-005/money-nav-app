/**
 * Quiz Empty State Widget
 * クイズ履歴が空の場合の表示
 */

import Link from "next/link";
import { Typography } from "@/shared/ui/typography";

export function QuizEmptyState() {
  return (
    <div className="p-12 rounded-3xl text-center bg-surface-secondary border border-(--border-primary)">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-surface-tertiary">
        <svg
          className="w-8 h-8 text-(--text-tertiary)"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
      </div>
      <Typography variant="M_bold" color="gray">
        まだクイズの回答履歴がありません
      </Typography>
      <Typography variant="S" color="muted" className="mt-2 mb-6">
        クイズに挑戦して学習履歴を作りましょう
      </Typography>
      <Link
        href="/quiz"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 bg-gradient-brand  shadow-glow-brand"
      >
        クイズに挑戦する
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
