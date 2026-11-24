/**
 * 検索インデックスから除外する用語集スラッグ（#17）。
 *
 * 飽和ヘッドワード中心で表示回数ゼロ・薄い commodity ページは、低権威ドメインの
 * 品質評価を希釈する。ここに列挙したスラッグはページを描画しつつ robots noindex を
 * 付与し、sitemap からも除外する（recrawl で index から自然に落とす）。
 *
 * 除外しない条件（＝ここに入れない）:
 * - GSC で表示のある語（cash-flow-statement / pbr / per / shareholders-equity）
 * - 開示イベントの key_concept にリンクする語（stock-issue / dividend-yield /
 *   ordinary-income / execution）
 * - 実需のあるビギナーコア語（nisa / ideco 等）
 *
 * 保守的な初期リスト（迷ったら残す方針）。効果測定後に見直す。
 */
export const NOINDEX_GLOSSARY_SLUGS: ReadonlySet<string> = new Set([
  "nikkei-average", // 「日経平均株価」が nikkei-225 と完全重複（301も併用）
  "margin-balance", // 信用残（advanced・ニッチ）
  "margin-maintenance-ratio", // 信用評価損益率（advanced・ニッチ）
  "sector-rotation", // セクターローテーション（advanced・ニッチ）
  "itayose", // 板寄せ（取引メカニズムの細目・初心者検索ほぼ無し）
  "circuit-breaker", // サーキットブレーカー（稀・ニッチ）
  "total-asset-turnover", // 総資産回転率（ニッチ指標）
  "net-asset-value", // 基準価額（投信の細目）
  "margin-call", // 追証（信用取引の細目）
]);

export function isGlossaryNoindexed(slug: string): boolean {
  return NOINDEX_GLOSSARY_SLUGS.has(slug);
}
