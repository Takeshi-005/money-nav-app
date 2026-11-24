"use client";

import Link from "next/link";
import type { NewsArticle } from "@/entities/news-article";
import { formatArticleDateForBreadcrumb } from "@/entities/news-article";
import { IconContainer } from "@/shared/ui/icon-container";
import { Typography } from "@/shared/ui/typography";

interface LatestNewsArticleCardProps {
  article: NewsArticle | null;
}

export function LatestNewsArticleCard({ article }: LatestNewsArticleCardProps) {
  return (
    <div className="p-5 rounded-3xl bg-surface-secondary border border-(--border-primary) shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <IconContainer size="md" rounded="md" bgColor="brand">
          <svg
            className="w-5 h-5 text-brand-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6Z" />
          </svg>
        </IconContainer>
        <Typography variant="L_bold">今日のニュース解説</Typography>
      </div>

      {!article ? (
        <div className="py-6 text-center space-y-1">
          <Typography variant="S" color="gray">
            本日の記事は準備中です
          </Typography>
          <Typography variant="caution" color="muted">
            平日7時に更新されます
          </Typography>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-full text-xs bg-brand-100 text-brand-600">
              {article.article_content.theme}
            </span>
            <Typography variant="caution" color="gray">
              {formatArticleDateForBreadcrumb(article.date)}
            </Typography>
          </div>

          <Typography variant="M_bold" className="mb-2 leading-snug">
            {article.article_content.title}
          </Typography>

          <Typography variant="S" color="gray" className="mb-4 leading-relaxed line-clamp-2">
            {article.article_content.summary}
          </Typography>

          <Link
            href={`/news-articles/${article.date}`}
            className="block w-full text-center text-sm font-medium px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] bg-surface-tertiary text-(--text-brand)"
          >
            続きを読む →
          </Link>
        </>
      )}
    </div>
  );
}
