/**
 * Quiz Entity - Formatters
 * クイズ関連のユーティリティ関数
 */

// 日付フォーマット関数は shared/lib/date に移行
export { formatDate, formatDateJapanese } from "@/shared/lib/date";

/**
 * 正解率を計算
 * @param correct 正解数
 * @param total 総数
 * @returns 正解率（%）
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((correct / total) * 100);
}
