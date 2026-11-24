import type { NewsArticleContent } from "@/types/supabase";

export const X_MAX_WEIGHT = 280;
export const X_URL_WEIGHT = 23;
const ELLIPSIS = "…";

export function withXUtmParams(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}utm_source=x&utm_medium=social`;
}

function getCharWeight(codePoint: number): number {
  if (
    (codePoint >= 0x0000 && codePoint <= 0x10ff) ||
    (codePoint >= 0x2000 && codePoint <= 0x200d) ||
    (codePoint >= 0x2010 && codePoint <= 0x201f) ||
    (codePoint >= 0x2032 && codePoint <= 0x2037)
  ) {
    return 1;
  }
  return 2;
}

export function getWeightedLength(text: string): number {
  let weight = 0;
  for (const char of text) {
    weight += getCharWeight(char.codePointAt(0) ?? 0);
  }
  return weight;
}

export function trimToWeight(text: string, maxWeight: number): string {
  let weight = 0;
  let result = "";
  for (const char of text) {
    const w = getCharWeight(char.codePointAt(0) ?? 0);
    if (weight + w > maxWeight) {
      break;
    }
    result += char;
    weight += w;
  }
  return result;
}

export function buildXPostText(
  articleContent: NewsArticleContent,
  articleUrl: string,
) {
  const hashtags = `#${articleContent.theme.replace(/[\s\u3000]+/g, "")} #投資 #投資初心者`;
  const body = articleContent.xPostBody || articleContent.summary;
  const separator = "\n\n";

  const hashtagsWeight = getWeightedLength(hashtags);
  const separatorWeight = getWeightedLength(separator) * 2;
  const overheadWeight = hashtagsWeight + separatorWeight + X_URL_WEIGHT;

  const bodyWeight = getWeightedLength(body);
  if (bodyWeight + overheadWeight <= X_MAX_WEIGHT) {
    return [body, hashtags, articleUrl].join(separator);
  }

  const ellipsisWeight = getWeightedLength(ELLIPSIS);
  const maxBodyWeight = X_MAX_WEIGHT - overheadWeight - ellipsisWeight;
  const trimmedBody = `${trimToWeight(body, maxBodyWeight)}${ELLIPSIS}`;
  return [trimmedBody, hashtags, articleUrl].join(separator);
}
