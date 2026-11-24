import type { Metadata } from "next";

export interface SeoOverride {
  title: string;
  description: string;
  keywords?: string[];
}

/**
 * 静的・診断結果ページ向けSEO上書きマップ。
 * パスをキーに、上書きしたいタイトル・ディスクリプション・キーワードを定義する。
 * 監査画面で改善案を生成した後、人間レビューを経てここに追記する運用。
 */
export const SEO_OVERRIDES: Record<string, SeoOverride> = {};

/**
 * 既存の generateMetadata 出力に上書きマップを適用する。
 * 上書きが存在しない場合はデフォルトをそのまま返す。
 */
export function applySeoOverride(
  pathname: string,
  defaultMetadata: Metadata,
): Metadata {
  const override = SEO_OVERRIDES[pathname];
  if (!override) {
    return defaultMetadata;
  }
  return {
    ...defaultMetadata,
    title: override.title,
    description: override.description,
    ...(override.keywords ? { keywords: override.keywords } : {}),
    openGraph: defaultMetadata.openGraph
      ? {
          ...defaultMetadata.openGraph,
          title: override.title,
          description: override.description,
        }
      : { title: override.title, description: override.description },
    twitter: defaultMetadata.twitter
      ? {
          ...defaultMetadata.twitter,
          title: override.title,
          description: override.description,
        }
      : undefined,
  };
}
