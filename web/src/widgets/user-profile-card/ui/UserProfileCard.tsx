"use client"

/**
 * User Profile Card Widget
 * ユーザー情報カード（アバター、名前、レベル、経験値）
 */
import { LevelCharacterAvatar, LevelBadge, ExperienceProgress, useLevel, getNextCharacterMilestone, NextCharacterPreview } from "@/entities/user"
import type { UserData, UserDisplayInfo } from "@/entities/user"
import { Typography } from "@/shared/ui/typography"

export interface UserProfileCardProps {
  user: UserDisplayInfo | null
  userData: UserData | null
}

export function UserProfileCard({ user, userData }: UserProfileCardProps) {
  const experience = userData?.experience ?? 0
  const { level, expInCurrentLevel, expProgress, expPerLevel } = useLevel(experience)
  const milestone = getNextCharacterMilestone(level, experience)

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-surface-secondary border border-(--border-primary) shadow-md">

      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* レベルキャラクター画像 */}
        <div className="flex items-center gap-4">
          <LevelCharacterAvatar level={level} size="md" />
          <div>
            <Typography variant="title_SS" as="h1" className="md:text-2xl text-foreground tracking-tighter">
              {user?.displayName || "ゲスト"}さん
            </Typography>
          </div>
        </div>

        {/* レベル・経験値 */}
        <div className="flex-1 md:max-w-sm">
          <div className="flex items-center gap-4">
            <LevelBadge level={level} />
            <ExperienceProgress
              current={expInCurrentLevel}
              max={expPerLevel}
              progress={expProgress}
            />
          </div>
          <NextCharacterPreview milestone={milestone} />
        </div>
      </div>
    </div>
  )
}
