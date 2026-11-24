export function normalizePagePath(fullUrl: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  if (fullUrl.startsWith(base)) {
    const path = fullUrl.slice(base.length);
    return path === "" ? "/" : path;
  }
  return fullUrl;
}
