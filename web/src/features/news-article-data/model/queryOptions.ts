import { queryOptions } from "@tanstack/react-query"
import { fetchNewsArticle } from "@/entities/news-article"
import { queryKeys } from "@/shared/api/query-client"

export const newsArticleQueryOptions = (date?: string) =>
  queryOptions({
    queryKey: queryKeys.newsArticle.byDate(date),
    queryFn: () => fetchNewsArticle(date),
    staleTime: 24 * 60 * 60 * 1000, // 1日
  })
