export const NEWS_CATEGORIES = [
  "市場動向",
  "金融政策",
  "為替",
  "政治経済",
  "企業業績",
  "テクノロジー",
  "世界経済",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];
