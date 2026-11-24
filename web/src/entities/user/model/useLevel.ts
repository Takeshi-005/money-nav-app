/**
 * User Entity - Level Hook
 * 経験値からレベル情報を計算するカスタムフック
 *
 * 逆指数カーブ設計:
 * - LV1→2: 20 EXP（初日達成可能）
 * - LV2→3: 50 EXP
 * - LV3→4: 100 EXP
 * - LV4→5: 150 EXP
 * - LV5→6: 200 EXP
 * - LV6以降: +250 EXPずつ増加
 */
import { useMemo } from "react"
import type { UserLevel } from "./types"

/**
 * 各レベルに必要な累計経験値
 * index = level - 1
 */
export const LEVEL_THRESHOLDS = [
  0, // LV1: 0 EXP から
  20, // LV2: 20 EXP から
  70, // LV3: 70 EXP から（+50）
  170, // LV4: 170 EXP から（+100）
  320, // LV5: 320 EXP から（+150）
  520, // LV6: 520 EXP から（+200）
] as const

/** LV6以降の1レベルあたりの増加量 */
const EXP_INCREMENT_AFTER_LV6 = 250

/**
 * 指定レベルに到達するために必要な累計経験値を取得
 */
export function getThresholdForLevel(level: number): number {
  if (level <= 1) {return 0}
  if (level <= LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[level - 1]
  }
  // LV6以降は+250ずつ増加
  const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const levelsAfter = level - LEVEL_THRESHOLDS.length
  return lastThreshold + levelsAfter * EXP_INCREMENT_AFTER_LV6
}

/**
 * 経験値からレベル情報を計算する（コアロジック）
 */
function computeLevel(experience: number): UserLevel {
  // 現在のレベルを計算
  let level = 1
  while (getThresholdForLevel(level + 1) <= experience) {
    level++
  }

  // 現在のレベルと次のレベルの閾値
  const currentThreshold = getThresholdForLevel(level)
  const nextThreshold = getThresholdForLevel(level + 1)

  // 現在のレベル内での経験値
  const expInCurrentLevel = experience - currentThreshold
  // 次のレベルまでに必要な経験値
  const expPerLevel = nextThreshold - currentThreshold
  // 進捗率
  const expProgress = (expInCurrentLevel / expPerLevel) * 100

  return {
    level,
    expInCurrentLevel,
    expProgress,
    expPerLevel,
  }
}

/**
 * 経験値からレベル情報を計算する
 * @param experience 現在の経験値
 * @returns レベル情報
 */
export function useLevel(experience: number): UserLevel {
  return useMemo(() => computeLevel(experience), [experience])
}

/**
 * 経験値からレベル情報を計算する（非フック版）
 * Server Componentやユーティリティ関数で使用
 */
export function calculateLevel(experience: number): UserLevel {
  return computeLevel(experience)
}
