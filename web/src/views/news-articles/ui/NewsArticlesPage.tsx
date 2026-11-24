import { Suspense } from "react"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { toNewsArticle } from "@/entities/news-article"
import { NewsArticlesPageClient } from "./NewsArticlesPageClient"

export async function NewsArticlesPage() {
  const supabase = createAdminClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await supabase
    .from("news_articles")
    .select("*")
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false })

  const articles = (data ?? [])
    .map(toNewsArticle)
    .filter((a): a is NonNullable<ReturnType<typeof toNewsArticle>> => a !== null)

  return (
    <Suspense fallback={null}>
      <NewsArticlesPageClient articles={articles} />
    </Suspense>
  )
}
