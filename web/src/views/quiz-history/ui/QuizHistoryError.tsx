"use client";

import { Typography } from "@/shared/ui/typography";

interface Props {
  onRetry: () => void;
}

export function QuizHistoryError({ onRetry }: Props) {
  return (
    <div className="max-w-2xl mx-auto my-8 px-6 sm:px-8 py-16 text-center bg-surface-secondary rounded-2xl shadow-sm">
      <Typography variant="title_S" as="h2" className="mb-3">
        クイズ履歴の取得に失敗しました
      </Typography>
      <Typography variant="S" className="text-(--text-secondary) mb-6">
        しばらく時間をおいてから再度お試しください。
      </Typography>
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
      >
        再読み込み
      </button>
    </div>
  );
}
