"use client"
import { useQuery } from "@tanstack/react-query"
import { newsArticleQueryOptions } from "./queryOptions"

export function useNewsArticle(date?: string) {
  const { data, isLoading, error } = useQuery(newsArticleQueryOptions(date))
  return { data, isLoading, error }
}
