import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export async function notifySearchEngines(urls: string[]): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl || urls.length === 0) {
    return;
  }

  const apiKey = process.env.INDEXNOW_API_KEY;
  if (apiKey) {
    try {
      const host = new URL(baseUrl).host;
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          key: apiKey,
          keyLocation: `https://${host}/${apiKey}.txt`,
          urlList: urls,
        }),
      });
      logger.info("IndexNow notification sent", {
        module: LOG_MODULES.LIB.SEARCH_ENGINES,
        status: response.status,
        urlCount: urls.length,
      });
    } catch (error) {
      logger.warn("IndexNow notification failed", {
        module: LOG_MODULES.LIB.SEARCH_ENGINES,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const sitemapUrl = encodeURIComponent(`${baseUrl}/sitemap.xml`);
  const results = await Promise.allSettled([
    fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`),
    fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`),
  ]);

  const statuses = results.map((r, i) => {
    const engine = i === 0 ? "Google" : "Bing";
    return r.status === "fulfilled"
      ? `${engine}:${r.value.status}`
      : `${engine}:failed`;
  });

  logger.info("Sitemap ping sent", {
    module: LOG_MODULES.LIB.SEARCH_ENGINES,
    results: statuses.join(", "),
  });
}
