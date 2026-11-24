import type { NewsArticle } from "@/entities/news-article";
import { formatArticleDateForBreadcrumb } from "@/entities/news-article";
import type { LinkableTerm } from "@/shared/lib/auto-link-glossary";
import { Typography } from "@/shared/ui/typography";
import { SocialShareButtons } from "@/shared/ui/social-share";
import { BRAND } from "@/shared/config";
import { ArticleSection } from "./ArticleSection";
import { RelatedTopicsSection } from "./RelatedTopicsSection";
import { ActionItemsSection } from "./ActionItemsSection";
import { CrossLinkSection } from "./CrossLinkSection";
import { MarketImpactSection } from "./MarketImpactSection";

interface Props {
  article: NewsArticle;
  glossaryTerms?: LinkableTerm[];
}

export function NewsArticleCard({ article, glossaryTerms = [] }: Props) {
  const { article_content, date } = article;
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/news-articles/${date}`;

  return (
    <article className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs bg-brand-100 text-brand-600 font-medium">
            {article_content.theme}
          </span>
          <span className="text-(--text-tertiary) text-xs">
            {formatArticleDateForBreadcrumb(date)}
          </span>
        </div>
        <Typography variant="title_S" as="h1" className="text-foreground leading-tight mb-3">
          {article_content.title}
        </Typography>
        <p className="text-(--text-secondary) leading-relaxed">
          {article_content.summary}
        </p>
        <SocialShareButtons
          url={shareUrl}
          text={`${article_content.title}｜${BRAND.NAME}`}
          className="mt-4"
        />
      </div>

      <div className="divide-y divide-(--border-primary)">
        {article_content.sections.map((section, i) => (
          <div key={i} className="py-6 first:pt-0">
            <ArticleSection
              section={section}
              index={i}
              glossaryTerms={glossaryTerms}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 p-5 rounded-2xl bg-gradient-brand-deep">
        <p className="text-xs font-semibold text-white/70 mb-2">
          💡 投資家目線のまとめ
        </p>
        <p className="text-white leading-relaxed text-sm">
          {article_content.investorInsight}
        </p>
      </div>

      {article_content.marketImpact && (
        <MarketImpactSection marketImpact={article_content.marketImpact} />
      )}

      {article_content.actionItems &&
        article_content.actionItems.length > 0 && (
          <ActionItemsSection items={article_content.actionItems} />
        )}

      <CrossLinkSection />

      <RelatedTopicsSection topics={article_content.relatedTopics} />
    </article>
  );
}
