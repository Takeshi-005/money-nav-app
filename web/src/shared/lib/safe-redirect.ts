/**
 * ログイン後の戻り先として使ってよいパスかを確かめる
 *
 * 外部のサイトへ飛ばされる(オープンリダイレクト)のを防ぐため、
 * 同じサイト内のパス("/" で始まり、"//" や "/\" で始まらないもの)だけを通す。
 */
export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  // 制御文字(改行・タブなど)を含むものは通さない
  if ([...value].some((char) => char.charCodeAt(0) <= 0x1f || char.charCodeAt(0) === 0x7f)) {
    return fallback;
  }

  try {
    const base = "https://example.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
