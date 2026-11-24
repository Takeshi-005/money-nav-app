export const EXCLUDED_SEO_PATH_PREFIXES = ["/admin"] as const;

export function isExcludedSeoPath(path: string): boolean {
  // TODO(human): EXCLUDED_SEO_PATH_PREFIXES のいずれかに該当するパスを true で返す。
  // "/admin" と "/admin/disclosures" は除外、"/" や "/news-articles" や
  // "/administrator"（別パス）は除外しないこと。
  return EXCLUDED_SEO_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
