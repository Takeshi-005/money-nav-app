import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ダッシュボード",
  description:
    "あなたの学習進捗を確認できます。投資スタイル診断結果、クイズ成績、レベル・経験値を一覧で表示。毎日の学習履歴と達成状況をチェックして、投資の理解を深めましょう。",
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * ダッシュボードページ
 * FSD構造に基づき、views層からre-export
 */
export { DashboardPage as default } from "@/views/dashboard"
