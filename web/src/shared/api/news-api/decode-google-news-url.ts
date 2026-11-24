const GOOGLE_NEWS_ARTICLE_PREFIX = "https://news.google.com/rss/articles/";
const URL_PATTERN = /https?:\/\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/;

function extractRealUrl(base64Str: string): string | null {
  try {
    const urlSafe = base64Str.replace(/-/g, "+").replace(/_/g, "/");
    const padded = urlSafe + "=".repeat((4 - (urlSafe.length % 4)) % 4);
    const binary = Buffer.from(padded, "base64").toString("binary");

    const match = binary.match(URL_PATTERN);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

export function decodeGoogleNewsUrl(url: string): string {
  if (!url || !url.startsWith(GOOGLE_NEWS_ARTICLE_PREFIX)) {
    return url;
  }

  const base64Part = url.slice(GOOGLE_NEWS_ARTICLE_PREFIX.length).split("?")[0];
  const realUrl = extractRealUrl(base64Part);

  return realUrl ?? url;
}
