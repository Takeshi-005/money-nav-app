import { XMLParser } from "fast-xml-parser";
import type { NewsArticle } from "./types";
import { decodeGoogleNewsUrl } from "./decode-google-news-url";

const RSS_BASE_URL = "https://news.google.com/rss/search";

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  source?: string | { "#text": string };
  description?: string;
}

interface RssFeed {
  rss?: {
    channel?: {
      item?: RssItem | RssItem[];
    };
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function cleanTitle(title: string): string {
  return title.replace(/ - [^-]+$/, "").trim();
}

function resolveSourceName(source: RssItem["source"]): string {
  if (!source) { return "Google News"; }
  if (typeof source === "string") { return source; }
  return source["#text"] ?? "Google News";
}

export async function fetchGoogleNewsRss(
  query: string,
  days: number = 3,
): Promise<NewsArticle[]> {
  const params = new URLSearchParams({
    q: query,
    hl: "ja",
    gl: "JP",
    ceid: "JP:ja",
    when: `${days}d`,
  });

  const url = `${RSS_BASE_URL}?${params.toString()}`;

  const response = await fetch(url, { next: { revalidate: 0 } });

  if (!response.ok) {
    throw new Error(`Google News RSS error: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    isArray: (name) => name === "item",
  });

  const feed: RssFeed = parser.parse(xml);
  const rawItems = feed?.rss?.channel?.item ?? [];
  const items: RssItem[] = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items.map((item) => ({
    source: {
      id: null,
      name: resolveSourceName(item.source),
    },
    author: null,
    title: cleanTitle(item.title ?? ""),
    description: item.description ? stripHtml(item.description) : null,
    url: decodeGoogleNewsUrl(item.link ?? ""),
    urlToImage: null,
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    content: null,
  }));
}
