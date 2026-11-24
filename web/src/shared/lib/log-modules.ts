/**
 * ログモジュール名の定数定義
 *
 * ログ出力時のmoduleフィールドで使用する定数。
 * タイプセーフティとIDE補完により、タイポを防止し、
 * Cloud Loggingでの検索性を向上させる。
 */
export const LOG_MODULES = {
  API: {
    CRON_NEWS_ARTICLE: "api/cron/generate-news-article",
    DIAGNOSIS: "api/diagnosis",
    QUIZ: "api/quiz",
    QUIZ_HISTORY: "api/quiz/history",
    NEWS_ARTICLES: "api/news-articles",
    SYNC: "api/sync",
    TEST_SLACK_NOTIFICATION: "api/test/slack-notification",
    CRON_SEO_DATA: "api/cron/collect-seo-data",
    CRON_GLOSSARY: "api/cron/generate-glossary-terms",
    DISCLOSURE_IMPACT: "api/disclosure-impact",
    CRON_PREDICTION: "api/cron/generate-prediction",
    PREDICTIONS: "api/predictions",
    ADMIN_SEO_AUDIT: "api/admin/seo-audit",
    ADMIN_GLOSSARY_BACKFILL: "api/admin/glossary/backfill",
    ADMIN_DISCLOSURES_PREVIEW: "api/admin/disclosures/preview",
    ADMIN_DISCLOSURES_IMPORT: "api/admin/disclosures/import",
    CRON_SEO_MONTHLY_REPORT: "api/cron/seo-monthly-report",
    ROADMAP: "api/roadmap",
  },
  LIB: {
    GEMINI: "lib/gemini",
    GEMINI_RETRY: "lib/gemini/retry",
    GEMINI_QUIZ_GENERATE: "lib/gemini/quiz/generate",
    GEMINI_QUIZ_JUDGE: "lib/gemini/quiz/judge",
    GEMINI_NEWS_ARTICLE_GENERATE: "lib/gemini/news-article/generate",
    GEMINI_NEWS_ARTICLE_JUDGE: "lib/gemini/news-article/judge",
    GEMINI_MARKET_SNAPSHOT: "lib/gemini/news-article/market-snapshot",
    GEMINI_PREDICTION_GENERATE: "lib/gemini/prediction/generate",
    MARKET_DATA_NIKKEI: "lib/market-data/nikkei",
    LOGGER: "lib/logger",
    AUTH_CONTEXT: "lib/auth-context",
    SLACK: "lib/slack",
    SEARCH_ENGINES: "lib/search-engines",
  },
  FEATURES: {
    AUTH: "features/auth",
  },
  COMPONENTS: {
    HEADER: "components/header",
    MOBILE_MENU: "components/mobile-menu",
  },
  VIEWS: {
    NEWS_ARTICLES: "views/news-articles",
  },
  APP: {
    LAYOUT: "app/layout",
    SITEMAP: "app/sitemap",
    NEWS_ARTICLES: "app/news-articles",
  },
} as const;

/**
 * ログモジュール名の型
 *
 * LOG_MODULESの値から自動的に型を生成
 */
export type LogModule =
  | (typeof LOG_MODULES.API)[keyof typeof LOG_MODULES.API]
  | (typeof LOG_MODULES.LIB)[keyof typeof LOG_MODULES.LIB]
  | (typeof LOG_MODULES.FEATURES)[keyof typeof LOG_MODULES.FEATURES]
  | (typeof LOG_MODULES.COMPONENTS)[keyof typeof LOG_MODULES.COMPONENTS]
  | (typeof LOG_MODULES.VIEWS)[keyof typeof LOG_MODULES.VIEWS]
  | (typeof LOG_MODULES.APP)[keyof typeof LOG_MODULES.APP];
