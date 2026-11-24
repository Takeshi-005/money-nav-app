/**
 * 投資セクターマスタ定義
 */

/** 日本株セクター（TOPIX-17準拠） */
export const JAPAN_SECTORS = [
  "食品",
  "エネルギー資源",
  "建設・資材",
  "素材・化学",
  "医薬品",
  "自動車・輸送機",
  "鉄鋼・非鉄",
  "機械",
  "電機・精密",
  "情報通信・サービス",
  "電力・ガス",
  "運輸・物流",
  "商社・卸売",
  "小売",
  "銀行",
  "金融（除く銀行）",
  "不動産",
] as const

/** 米国株セクター（GICS準拠） */
export const US_SECTORS = [
  "情報技術",
  "ヘルスケア",
  "金融",
  "一般消費財",
  "通信サービス",
  "資本財",
  "生活必需品",
  "エネルギー",
  "公益事業",
  "不動産",
  "素材",
] as const

/** 地域に応じたセクター取得 */
export function getSectorsByRegion(region: "japan" | "us"): readonly string[] {
  return region === "japan" ? JAPAN_SECTORS : US_SECTORS
}

/** プロンプト用セクターリスト生成（カンマ区切り） */
export function formatSectorsForPrompt(region: "japan" | "us"): string {
  const sectors = getSectorsByRegion(region)
  return sectors.join("、")
}
