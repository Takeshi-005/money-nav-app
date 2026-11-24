import type { NewsArticleContent } from "@/types/supabase"

export interface NewsArticle {
  date: string
  article_content: NewsArticleContent
  created_at: string
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string[] | null
}

export type { NewsArticleContent }
