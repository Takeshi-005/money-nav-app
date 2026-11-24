"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchNewsArticleAdjacentDates } from "../api/fetchAdjacentDates";
import { queryKeys } from "@/shared/api/query-client";

export function useNewsArticleAdjacentDates(date: string) {
  return useQuery({
    queryKey: queryKeys.newsArticle.adjacent(date),
    queryFn: () => fetchNewsArticleAdjacentDates(date),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
