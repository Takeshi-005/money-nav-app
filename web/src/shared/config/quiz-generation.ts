/**
 * クイズ生成の設定
 * カテゴリ選択数、重複チェック日数などを管理
 */
import type { QuizType } from "@/types/supabase"

export const QUIZ_GENERATION_CONFIG = {
  DAILY_QUIZ_COUNT: 3,

  ENABLED_CATEGORIES: [
    "news",
    "psychology",
    "history",
    "basic",
    "scenario",
  ] as QuizType[],

  DUPLICATE_CHECK_DAYS: 7,

  FORCE_NEWS_CATEGORY: true,
} as const

export function selectDailyCategories(): QuizType[] {
  const { DAILY_QUIZ_COUNT, ENABLED_CATEGORIES, FORCE_NEWS_CATEGORY } =
    QUIZ_GENERATION_CONFIG

  if (FORCE_NEWS_CATEGORY) {
    const otherCategories = ENABLED_CATEGORIES.filter((c) => c !== "news")
    const shuffled = [...otherCategories].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, DAILY_QUIZ_COUNT - 1)
    return ["news", ...selected]
  } else {
    const shuffled = [...ENABLED_CATEGORIES].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, DAILY_QUIZ_COUNT)
  }
}
