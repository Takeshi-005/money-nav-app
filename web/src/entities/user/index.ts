/**
 * User Entity - Public API
 */

// Types
export type { UserData, UserLevel, UserDisplayInfo } from "./model/types"
export type { CharacterMilestone } from "./model/getNextCharacterMilestone"

// Hooks & Utils
export { useLevel, calculateLevel, LEVEL_THRESHOLDS, getThresholdForLevel } from "./model/useLevel"
export { getLevelImagePath } from "./model/getLevelImagePath"
export { getNextCharacterMilestone } from "./model/getNextCharacterMilestone"

// Components
export { UserAvatar, type UserAvatarProps } from "./ui/UserAvatar"
export { LevelBadge, type LevelBadgeProps } from "./ui/LevelBadge"
export { ExperienceProgress, type ExperienceProgressProps } from "./ui/ExperienceProgress"
export { LevelCharacterAvatar, type LevelCharacterAvatarProps } from "./ui/LevelCharacterAvatar"
export { NextCharacterPreview, type NextCharacterPreviewProps } from "./ui/NextCharacterPreview"
