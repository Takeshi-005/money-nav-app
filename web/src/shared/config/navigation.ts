export const NAVIGATION_PATHS = {
  ROOT: "/",
  DIAGNOSIS: "/diagnosis",
  QUIZ: "/quiz",
  NEWS_ARTICLES: "/news-articles",
  TOMORROW_IMPACT: "/tomorrow-impact",
  INVESTOR_GUIDES: "/investor-guides",
  GLOSSARY: "/glossary",
  ROADMAP: "/roadmap",
  DASHBOARD: "/dashboard",
  LOGIN: "/login",
  ABOUT: "/about",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  DISCLAIMER: "/disclaimer",
} as const;

export const NAVIGATION_BUILDERS = {
  newsArticleDetail: (date: string) =>
    `${NAVIGATION_PATHS.NEWS_ARTICLES}/${date}`,
  glossaryDetail: (slug: string) => `${NAVIGATION_PATHS.GLOSSARY}/${slug}`,
  tomorrowImpactDetail: (date: string) =>
    `${NAVIGATION_PATHS.TOMORROW_IMPACT}/${date}`,
  tomorrowImpactEventDetail: (date: string, ticker: string) =>
    `${NAVIGATION_PATHS.TOMORROW_IMPACT}/${date}/${ticker}`,
  diagnosisResult: (code: string) =>
    `${NAVIGATION_PATHS.DIAGNOSIS}/result/${code}`,
} as const;

export const PRIMARY_NAV_LINKS = [
  {
    href: NAVIGATION_PATHS.TOMORROW_IMPACT,
    label: "明日の好悪材料",
    emoji: "📌",
  },
] as const;

export const SECONDARY_NAV_LINKS = [
  {
    href: NAVIGATION_PATHS.ROADMAP,
    label: "ロードマップ",
    emoji: "🗺️",
  },
  {
    href: NAVIGATION_PATHS.INVESTOR_GUIDES,
    label: "投資家ガイド",
    emoji: "📚",
  },
  { href: NAVIGATION_PATHS.NEWS_ARTICLES, label: "ニュース解説", emoji: "📰" },
  { href: NAVIGATION_PATHS.GLOSSARY, label: "用語辞典", emoji: "📖" },
] as const;

export const MAIN_NAV_LINKS = [
  ...PRIMARY_NAV_LINKS,
  ...SECONDARY_NAV_LINKS,
] as const;

export const FOOTER_SERVICE_LINKS = [
  { href: NAVIGATION_PATHS.DIAGNOSIS, label: "投資スタイル診断" },
  { href: NAVIGATION_PATHS.QUIZ, label: "デイリークイズ" },
  { href: NAVIGATION_PATHS.NEWS_ARTICLES, label: "ニュース解説" },
  { href: NAVIGATION_PATHS.TOMORROW_IMPACT, label: "明日の好悪材料分析" },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: NAVIGATION_PATHS.ABOUT, label: "運営者情報" },
  { href: NAVIGATION_PATHS.PRIVACY, label: "プライバシーポリシー" },
  { href: NAVIGATION_PATHS.TERMS, label: "利用規約" },
  { href: NAVIGATION_PATHS.DISCLAIMER, label: "免責事項" },
] as const;

export const STATIC_NAVIGATION_PATHS = [
  NAVIGATION_PATHS.ROOT,
  NAVIGATION_PATHS.DIAGNOSIS,
  NAVIGATION_PATHS.QUIZ,
  NAVIGATION_PATHS.TOMORROW_IMPACT,
  NAVIGATION_PATHS.NEWS_ARTICLES,
  NAVIGATION_PATHS.INVESTOR_GUIDES,
  NAVIGATION_PATHS.GLOSSARY,
  NAVIGATION_PATHS.ABOUT,
  NAVIGATION_PATHS.PRIVACY,
  NAVIGATION_PATHS.TERMS,
  NAVIGATION_PATHS.DISCLAIMER,
] as const;
