const ENUM_MARKER_PATTERN = /(?=[①②③④⑤⑥⑦⑧⑨⑩])/;

/**
 * 解説文を丸数字マーカー（①②③…）の前で分割する。
 * マーカーが無ければ元の文字列を1要素で返す。
 */
export function splitByEnumMarkers(text: string): string[] {
  const parts = text.split(ENUM_MARKER_PATTERN).map((p) => p.trim());
  const nonEmpty = parts.filter((p) => p.length > 0);
  return nonEmpty.length > 0 ? nonEmpty : [text];
}
