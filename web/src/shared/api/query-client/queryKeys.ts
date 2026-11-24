/**
 * QueryKey 定義
 * 命名規則: [ドメイン, エンティティ, パラメータ]
 */
export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ["dashboard"] as const,
    data: () => [...queryKeys.dashboard.all, "data"] as const,
  },

  // Quiz
  quiz: {
    all: ["quiz"] as const,
    today: () => [...queryKeys.quiz.all, "today"] as const,
    history: () => [...queryKeys.quiz.all, "history"] as const,
    historyDetailed: () =>
      [...queryKeys.quiz.all, "history", "detailed"] as const,
  },

  // News Articles
  newsArticle: {
    all: ["news-article"] as const,
    byDate: (date?: string) =>
      date
        ? ([...queryKeys.newsArticle.all, "date", date] as const)
        : ([...queryKeys.newsArticle.all, "latest"] as const),
    adjacent: (date: string) =>
      [...queryKeys.newsArticle.all, "adjacent", date] as const,
  },

  // Admin: Watched Stocks
  adminWatchedStocks: {
    all: ["admin-watched-stocks"] as const,
  },

  // Disclosure Impact (適時開示の影響分析)
  disclosureImpact: {
    all: ["disclosure-impact"] as const,
    byDate: (date: string) =>
      [...queryKeys.disclosureImpact.all, "date", date] as const,
  },

  // Prediction Training
  prediction: {
    all: ["prediction"] as const,
    today: () => [...queryKeys.prediction.all, "today"] as const,
  },

  // Roadmap (投資家成長ロードマップ)
  roadmap: {
    all: ["roadmap"] as const,
    flags: () => [...queryKeys.roadmap.all, "flags"] as const,
  },

  // Admin: SEO Audit
  seoAudit: {
    all: ["seo-audit"] as const,
    list: (classification?: string) =>
      classification
        ? ([...queryKeys.seoAudit.all, "list", classification] as const)
        : ([...queryKeys.seoAudit.all, "list"] as const),
    detail: (pagePath: string) =>
      [...queryKeys.seoAudit.all, "detail", pagePath] as const,
  },
} as const;
