/**
 * Quiz Entity - Difficulty Logic
 * ユーザーレベルから難易度を判定するロジック
 */

// eslint-disable-next-line boundaries/dependencies -- entities間の依存。#58 で解消予定
import { calculateLevel } from "@/entities/user"
import type { DifficultyLevel } from "@/types/supabase"

/**
 * 難易度別のレベル閾値
 */
export const DIFFICULTY_THRESHOLDS = {
  beginner: { minLevel: 1, maxLevel: 10 },
  intermediate: { minLevel: 11, maxLevel: 30 },
  advanced: { minLevel: 31, maxLevel: null },
} as const

/**
 * 経験値から難易度を判定
 * @param experience ユーザーの累計経験値
 * @returns 難易度レベル
 */
export function getDifficultyFromExperience(experience: number): DifficultyLevel {
  const { level } = calculateLevel(experience)
  return getDifficultyFromLevel(level)
}

/**
 * レベルから難易度を判定
 * @param level ユーザーレベル
 * @returns 難易度レベル
 */
export function getDifficultyFromLevel(level: number): DifficultyLevel {
  if (level <= 10) {return "beginner"}
  if (level <= 30) {return "intermediate"}
  return "advanced"
}
