import { MetadataRoute } from "next";
import { createAdminClient } from "@/shared/api/supabase/admin";
import {
  findGlossaryTermSlugs,
  isGlossaryNoindexed,
} from "@/entities/glossary-term";
import {
  getDatesWithImpactAnalyses,
  getDateTickerPairs,
} from "@/views/tomorrow-impact";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { INVESTOR_TYPE_CODES } from "@/entities/diagnosis";
import {
  NAVIGATION_BUILDERS,
  NAVIGATION_PATHS,
  STATIC_NAVIGATION_PATHS,
} from "@/shared/config";

const FRESH_DAYS = 30;

function isFreshDate(dateStr: string): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FRESH_DAYS);
  return new Date(dateStr) >= cutoff;
}

type StaticPageMeta = {
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

type StaticPath = (typeof STATIC_NAVIGATION_PATHS)[number];

const STATIC_PAGE_META: Record<StaticPath, StaticPageMeta> = {
  [NAVIGATION_PATHS.ROOT]: { changeFrequency: "daily", priority: 1.0 },
  [NAVIGATION_PATHS.DIAGNOSIS]: { changeFrequency: "weekly", priority: 0.9 },
  [NAVIGATION_PATHS.QUIZ]: { changeFrequency: "daily", priority: 0.9 },
  [NAVIGATION_PATHS.TOMORROW_IMPACT]: { changeFrequency: "daily", priority: 0.8 },
  [NAVIGATION_PATHS.NEWS_ARTICLES]: { changeFrequency: "daily", priority: 0.8 },
  [NAVIGATION_PATHS.INVESTOR_GUIDES]: { changeFrequency: "weekly", priority: 0.8 },
  [NAVIGATION_PATHS.GLOSSARY]: { changeFrequency: "weekly", priority: 0.8 },
  [NAVIGATION_PATHS.ABOUT]: { changeFrequency: "monthly", priority: 0.3 },
  [NAVIGATION_PATHS.PRIVACY]: { changeFrequency: "monthly", priority: 0.3 },
  [NAVIGATION_PATHS.TERMS]: { changeFrequency: "monthly", priority: 0.3 },
  [NAVIGATION_PATHS.DISCLAIMER]: { changeFrequency: "monthly", priority: 0.3 },
};

const STATIC_PAGE_LAST_MODIFIED: Record<StaticPath, string> = {
  [NAVIGATION_PATHS.ROOT]: "2026-06-01",
  [NAVIGATION_PATHS.DIAGNOSIS]: "2026-05-15",
  [NAVIGATION_PATHS.QUIZ]: "2026-05-15",
  [NAVIGATION_PATHS.TOMORROW_IMPACT]: "2026-06-08",
  [NAVIGATION_PATHS.NEWS_ARTICLES]: "2026-06-01",
  [NAVIGATION_PATHS.INVESTOR_GUIDES]: "2026-05-15",
  [NAVIGATION_PATHS.GLOSSARY]: "2026-06-01",
  [NAVIGATION_PATHS.ABOUT]: "2026-04-01",
  [NAVIGATION_PATHS.PRIVACY]: "2026-04-01",
  [NAVIGATION_PATHS.TERMS]: "2026-04-01",
  [NAVIGATION_PATHS.DISCLAIMER]: "2026-04-01",
};

const DIAGNOSIS_RESULT_LAST_MODIFIED = "2026-05-15";

function getStaticPageMeta(path: StaticPath): StaticPageMeta {
  return STATIC_PAGE_META[path];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://money-nav.com";

  const staticPages: MetadataRoute.Sitemap = [
    ...STATIC_NAVIGATION_PATHS.map((path) => {
      const meta = getStaticPageMeta(path);
      return {
        url: path === NAVIGATION_PATHS.ROOT ? baseUrl : `${baseUrl}${path}`,
        lastModified: new Date(STATIC_PAGE_LAST_MODIFIED[path]),
        changeFrequency: meta.changeFrequency,
        priority: meta.priority,
      };
    }),
    ...INVESTOR_TYPE_CODES.map((code) => ({
      url: `${baseUrl}${NAVIGATION_BUILDERS.diagnosisResult(code.toLowerCase())}`,
      lastModified: new Date(DIAGNOSIS_RESULT_LAST_MODIFIED),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  try {
    const supabase = createAdminClient();

    const [{ data: newsArticles, error: newsArticlesError }] =
      await Promise.all([
        supabase
          .from("news_articles")
          .select("date, created_at")
          .order("date", { ascending: false }),
      ]);

    let glossaryTermSlugs: { slug: string; updated_at: string | null }[] = [];
    try {
      glossaryTermSlugs = await findGlossaryTermSlugs();
    } catch (glossaryError) {
      logger.error("Error fetching glossary terms for sitemap", {
        module: LOG_MODULES.APP.SITEMAP,
        error:
          glossaryError instanceof Error
            ? glossaryError.message
            : String(glossaryError),
      });
    }

    let tomorrowImpactDates: string[] = [];
    try {
      tomorrowImpactDates = await getDatesWithImpactAnalyses(180);
    } catch (impactError) {
      logger.error("Error fetching tomorrow-impact dates for sitemap", {
        module: LOG_MODULES.APP.SITEMAP,
        error:
          impactError instanceof Error
            ? impactError.message
            : String(impactError),
      });
    }

    let disclosureEventPairs: { date: string; ticker: string }[] = [];
    try {
      disclosureEventPairs = await getDateTickerPairs(2000);
    } catch (eventError) {
      logger.error("Error fetching disclosure event pairs for sitemap", {
        module: LOG_MODULES.APP.SITEMAP,
        error:
          eventError instanceof Error ? eventError.message : String(eventError),
      });
    }

    if (newsArticlesError) {
      logger.error("Error fetching news articles for sitemap", {
        module: LOG_MODULES.APP.SITEMAP,
        error:
          newsArticlesError instanceof Error
            ? newsArticlesError.message
            : String(newsArticlesError),
      });
    }

    const newsArticlePages: MetadataRoute.Sitemap =
      !newsArticlesError && newsArticles
        ? newsArticles.map((article) => {
            const fresh = isFreshDate(article.date);
            return {
              url: `${baseUrl}${NAVIGATION_BUILDERS.newsArticleDetail(article.date)}`,
              lastModified: article.created_at
                ? new Date(article.created_at)
                : new Date(),
              changeFrequency: (fresh ? "daily" : "yearly") as
                | "daily"
                | "yearly",
              priority: fresh ? 0.7 : 0.4,
            };
          })
        : [];

    const tomorrowImpactPages: MetadataRoute.Sitemap = tomorrowImpactDates.map(
      (date) => {
        const fresh = isFreshDate(date);
        return {
          url: `${baseUrl}${NAVIGATION_BUILDERS.tomorrowImpactDetail(date)}`,
          lastModified: new Date(`${date}T07:00:00+09:00`),
          changeFrequency: (fresh ? "daily" : "monthly") as "daily" | "monthly",
          priority: fresh ? 0.7 : 0.5,
        };
      },
    );

    const disclosureEventPages: MetadataRoute.Sitemap = disclosureEventPairs.map(
      ({ date, ticker }) => {
        const fresh = isFreshDate(date);
        return {
          url: `${baseUrl}${NAVIGATION_BUILDERS.tomorrowImpactEventDetail(date, ticker)}`,
          lastModified: new Date(`${date}T07:00:00+09:00`),
          changeFrequency: (fresh ? "daily" : "monthly") as "daily" | "monthly",
          priority: fresh ? 0.6 : 0.4,
        };
      },
    );

    const glossaryPages: MetadataRoute.Sitemap = glossaryTermSlugs
      .filter((term) => !isGlossaryNoindexed(term.slug))
      .map((term) => ({
        url: `${baseUrl}${NAVIGATION_BUILDERS.glossaryDetail(term.slug)}`,
        lastModified: term.updated_at ? new Date(term.updated_at) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    return [
      ...staticPages,
      ...newsArticlePages,
      ...tomorrowImpactPages,
      ...disclosureEventPages,
      ...glossaryPages,
    ];
  } catch (error) {
    logger.error("Error generating sitemap", {
      module: LOG_MODULES.APP.SITEMAP,
      error: error instanceof Error ? error.message : String(error),
      stack:
        error instanceof Error
          ? error.stack?.split("\n").slice(0, 5).join("\n")
          : undefined,
    });
    return staticPages;
  }
}
