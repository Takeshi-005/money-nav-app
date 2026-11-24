"use client";
import Link from "next/link";
import { useNewsArticleAdjacentDates } from "@/features/news-article-data";
import { formatArticleDateForBreadcrumb } from "@/entities/news-article";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";

interface DateNavigationProps {
  currentDate: string;
  className?: string;
}

export function DateNavigation({
  currentDate,
  className,
}: DateNavigationProps) {
  const { data, isLoading } = useNewsArticleAdjacentDates(currentDate);

  if (isLoading) {
    return null;
  }

  const hasPrev = data?.prevDate;
  const hasNext = data?.nextDate;

  if (!hasPrev && !hasNext) {
    return null;
  }

  return (
    <nav
      aria-label="前後のニュース解説記事"
      className={cn("flex items-center justify-between gap-4", className)}
    >
      <div>
        {hasPrev && data.prevDate ? (
          <Link
            href={`/news-articles/${data.prevDate}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors text-(--text-secondary) hover:text-foreground"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <div className="text-left">
              <Typography variant="caution" className="text-(--text-tertiary)">
                前の記事
              </Typography>
              <Typography variant="M_bold">
                {formatArticleDateForBreadcrumb(data.prevDate)}
              </Typography>
            </div>
          </Link>
        ) : (
          <div className="px-5 py-3 rounded-xl bg-surface-tertiary cursor-not-allowed opacity-50">
            <Typography variant="M" className="text-(--text-tertiary)">
              これより前の記事はありません
            </Typography>
          </div>
        )}
      </div>

      <div>
        {hasNext && data.nextDate ? (
          <Link
            href={`/news-articles/${data.nextDate}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors text-(--text-secondary) hover:text-foreground"
          >
            <div className="text-right">
              <Typography variant="caution" className="text-(--text-tertiary)">
                次の記事
              </Typography>
              <Typography variant="M_bold">
                {formatArticleDateForBreadcrumb(data.nextDate)}
              </Typography>
            </div>
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ) : (
          <div className="px-5 py-3 rounded-xl bg-surface-tertiary cursor-not-allowed opacity-50">
            <Typography variant="M" className="text-(--text-tertiary)">
              これより後の記事はありません
            </Typography>
          </div>
        )}
      </div>
    </nav>
  );
}
