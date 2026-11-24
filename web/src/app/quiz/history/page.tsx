import type { Metadata } from "next";
import { Suspense } from "react";
import { QuizHistoryPage, QuizHistorySkeleton } from "@/views/quiz-history";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";

export const metadata: Metadata = {
  title: "クイズ履歴",
  description:
    "過去のクイズ回答履歴と成績を詳細表示。正答率、獲得経験値、解答した日時を確認できます。学習の振り返りに活用して、投資判断力を継続的に向上させましょう。",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * クイズ履歴ページ
 * 過去のクイズ回答履歴と成績を詳細表示
 */

export default function Page() {
  const breadcrumbItems = [
    { label: "ホーム", href: "/" },
    { label: "ダッシュボード", href: "/dashboard" },
    { label: "クイズ履歴" },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} className="max-w-6xl mx-auto px-4" />
      <Suspense fallback={<QuizHistorySkeleton />}>
        <QuizHistoryPage />
      </Suspense>
    </>
  );
}
