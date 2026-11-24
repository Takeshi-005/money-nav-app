/**
 * Quiz Entity - Constants
 * クイズ関連の定数定義
 */

import type { QuizType } from "./types"

/** クイズ種別のラベル */
export const QUIZ_TYPE_LABELS: Record<string, string> = {
  news: "時事",
  basic: "基本",
  scenario: "シナリオ",
  psychology: "心理",
  history: "歴史",
}

/** クイズタブ設定 */
export const QUIZ_TABS: { type: QuizType; label: string }[] = [
  { type: "news", label: "時事" },
  { type: "basic", label: "基本" },
  { type: "scenario", label: "シナリオ" },
  { type: "psychology", label: "心理" },
  { type: "history", label: "歴史" },
]

/** クイズ更新時刻 */
export const QUIZ_UPDATE_TIME = "毎日 9:00 更新"
