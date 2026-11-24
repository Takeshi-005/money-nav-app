import { getThresholdForLevel } from "./useLevel"
import { getLevelImagePath } from "./getLevelImagePath"

export interface CharacterMilestone {
  level: number
  requiredExp: number
  remainingExp: number
  nextImagePath: string
}

const CHARACTER_CHANGE_LEVELS = [6, 11, 16] as const

/**
 * 次のキャラクター変化マイルストーンを取得
 * @param currentLevel 現在のレベル
 * @param currentExp 現在の経験値
 * @returns 次のマイルストーン情報。LV16以降の場合はnull
 */
export function getNextCharacterMilestone(
  currentLevel: number,
  currentExp: number
): CharacterMilestone | null {
  const nextMilestone = CHARACTER_CHANGE_LEVELS.find(
    (milestoneLevel) => currentLevel < milestoneLevel
  )

  if (!nextMilestone) {
    return null
  }

  const requiredExp = getThresholdForLevel(nextMilestone)
  const remainingExp = requiredExp - currentExp

  return {
    level: nextMilestone,
    requiredExp,
    remainingExp,
    nextImagePath: getLevelImagePath(nextMilestone),
  }
}
