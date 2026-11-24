/**
 * React Query 設定プリセット
 * データ更新頻度に応じたstaleTime定義
 */

export const STALE_TIME = {
  /** 頻繁に更新されるデータ（ダッシュボード、リアルタイム系） */
  FREQUENT: 2 * 60 * 1000, // 2分

  /** 標準的な更新頻度（デフォルト = グローバル設定と同じ） */
  MODERATE: 5 * 60 * 1000, // 5分

  /** 固定データ（日次レポート、マスターデータ） */
  STATIC: 30 * 60 * 1000, // 30分
} as const

export const GC_TIME = {
  /** デフォルト（グローバル設定と同じ） */
  DEFAULT: 30 * 60 * 1000, // 30分

  /** 長期保持（日次固定データなど） */
  EXTENDED: 60 * 60 * 1000, // 1時間
} as const
