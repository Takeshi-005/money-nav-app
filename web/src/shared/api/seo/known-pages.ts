import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { NAVIGATION_BUILDERS, STATIC_NAVIGATION_PATHS } from "@/shared/config";

export type KnownPageKind =
  | "static"
  | "diagnosis_result"
  | "news_article"
  | "glossary";

export interface KnownPage {
  path: string;
  kind: KnownPageKind;
  editable: boolean;
}

const DIAGNOSIS_RESULT_CODES = [
  "BUFFETT",
  "LYNCH",
  "SOROS",
  "GRAHAM",
  "ONEILL",
  "TEMPLETON",
  "BOGLE",
  "DALIO",
];

/**
 * 監査対象として認識する全ページを列挙する。
 * Search Console上にクエリ行が存在しない（=クエリ未獲得）ページも
 * ここで列挙されることで、監査画面に現れる。
 */
export async function listKnownPages(
  supabase: SupabaseClient<Database>,
): Promise<KnownPage[]> {
  const pages: KnownPage[] = [
    ...STATIC_NAVIGATION_PATHS.map((path) => ({
      path,
      kind: "static" as const,
      editable: false,
    })),
    ...DIAGNOSIS_RESULT_CODES.map((code) => ({
      path: NAVIGATION_BUILDERS.diagnosisResult(code),
      kind: "diagnosis_result" as const,
      editable: false,
    })),
  ];

  const { data: articles } = await supabase
    .from("news_articles")
    .select("date")
    .order("date", { ascending: false })
    .limit(60);
  if (articles) {
    for (const a of articles) {
      pages.push({
        path: NAVIGATION_BUILDERS.newsArticleDetail(a.date),
        kind: "news_article",
        editable: true,
      });
    }
  }

  const { data: terms } = await supabase.from("glossary_terms").select("slug");
  if (terms) {
    for (const t of terms) {
      if (t.slug) {
        pages.push({
          path: NAVIGATION_BUILDERS.glossaryDetail(t.slug),
          kind: "glossary",
          editable: false,
        });
      }
    }
  }

  return pages;
}
