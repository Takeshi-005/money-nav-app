"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { NewsArticle } from "@/entities/news-article";
import { formatArticleDateForBreadcrumb } from "@/entities/news-article";
import { Typography } from "@/shared/ui/typography";
import { CategoryFilter } from "./CategoryFilter";

interface Props {
  articles: NewsArticle[];
}

export function NewsArticlesPageClient({ articles }: Props) {
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");

  const filteredArticles = useMemo(() => {
    if (!selectedCategory) {
      return articles;
    }
    return articles.filter(
      (a) => a.article_content.category === selectedCategory,
    );
  }, [articles, selectedCategory]);

  if (articles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-8 px-6 sm:px-8 py-16 text-center bg-surface-secondary rounded-2xl shadow-sm">
        <span aria-hidden="true" className="text-4xl mb-4 block">
          📰
        </span>
        <Typography variant="title_SS" as="h2" className="text-foreground mb-2">
          記事はまだありません
        </Typography>
        <Typography variant="caution" className="text-(--text-tertiary)">
          毎日の投資ニュース解説記事は平日朝7時に生成されます。
        </Typography>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 px-6 sm:px-8 py-8 bg-surface-secondary rounded-2xl shadow-sm">
      <div className="mb-8">
        <Typography variant="title_S" as="h1" className="text-foreground mb-2">
          ニュース解説記事
        </Typography>
        <Typography variant="S" className="text-(--text-secondary)">
          毎日の投資ニュースを初心者向けにわかりやすく解説します
        </Typography>
      </div>

      <CategoryFilter selectedCategory={selectedCategory} />

      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="py-12 text-center">
            <Typography variant="S" className="text-(--text-tertiary)">
              このカテゴリの記事はまだありません
            </Typography>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <Link
              key={article.date}
              href={`/news-articles/${article.date}`}
              className="block p-5 rounded-2xl bg-surface-secondary border border-(--border-primary) hover:border-brand-300 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Typography
                  as="span"
                  variant="caution"
                  className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-600"
                >
                  {article.article_content.theme}
                </Typography>
                <Typography
                  as="span"
                  variant="caution"
                  className="text-(--text-tertiary)"
                >
                  {formatArticleDateForBreadcrumb(article.date)}
                </Typography>
              </div>
              <Typography variant="M_bold" as="h2" className="mb-1">
                {article.article_content.title}
              </Typography>
              <Typography
                variant="S"
                className="text-(--text-secondary) line-clamp-2"
              >
                {article.article_content.summary}
              </Typography>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
