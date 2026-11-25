/**
 * 構造化データ(JSON-LD)を <script> に埋め込む文字列にする
 *
 * JSON.stringify だけでは記事タイトルなどに含まれる "</script>" で
 * script 要素が閉じられ、HTML を差し込まれるおそれがある。
 * "<" ">" "&" と、JavaScript で改行扱いになる U+2028・U+2029 を Unicode エスケープにする。
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
