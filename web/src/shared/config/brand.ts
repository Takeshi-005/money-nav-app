export const BRAND = {
  NAME: "マネイッポ",
  TAGLINE: "判断はあなたに、情報整理はAIに。",
  SUB_TAGLINE: "投資知識ゼロから始められる無料の学習アプリ",
  POWERED_BY: "powered by AI",
  DOMAIN: "money-nav.com",
  X_URL: "https://x.com/AI990132664209",
  DESCRIPTION_SHORT: "投資初心者のための学習支援サービス",
} as const;

/**
 * ページタイトル合成ヘルパー
 *
 * 各ページの metadata で散在していた合成タイトルを一元化するための派生定義。
 * これらを変更すればサイト全体のタイトル表記が追従する。
 */
const TITLE_SEPARATOR = " | ";

// トップ/デフォルト用の完全タイトル（サービス名 + タグライン）
export const BRAND_TITLE_DEFAULT = `${BRAND.NAME}${TITLE_SEPARATOR}${BRAND.TAGLINE}`;

// Next.js metadata の title.template 用（%s はページ名のプレースホルダー）
export const BRAND_TITLE_TEMPLATE = `%s${TITLE_SEPARATOR}${BRAND.NAME}`;

// 個別ページ用の合成タイトル（ページ名 + サービス名）
export function buildPageTitle(pageTitle: string): string {
  return BRAND_TITLE_TEMPLATE.replace("%s", pageTitle);
}
