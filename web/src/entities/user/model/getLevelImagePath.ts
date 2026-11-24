/**
 * レベル範囲と画像パスのマッピング
 */
const LEVEL_IMAGE_RANGES = [
  { minLevel: 1, maxLevel: 5, imagePath: "/level/lv-01-05.webp" },
  { minLevel: 6, maxLevel: 10, imagePath: "/level/lv-06-10.webp" },
  { minLevel: 11, maxLevel: 15, imagePath: "/level/lv-11-15.webp" },
  { minLevel: 16, maxLevel: 20, imagePath: "/level/lv-16-20.webp" },
] as const

const DEFAULT_IMAGE_PATH = "/level/lv-16-20.webp"

/**
 * レベルに対応するキャラクター画像パスを取得
 * @param level ユーザーレベル (1以上の整数)
 * @returns 画像パス（/level/lv-XX-YY.拡張子）
 */
export function getLevelImagePath(level: number): string {
  if (level < 1) {return LEVEL_IMAGE_RANGES[0].imagePath}

  const range = LEVEL_IMAGE_RANGES.find(
    (r) => level >= r.minLevel && level <= r.maxLevel
  )

  return range?.imagePath ?? DEFAULT_IMAGE_PATH
}
