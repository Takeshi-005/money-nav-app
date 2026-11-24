import { createAdminClient } from "@/shared/api/supabase/admin";
import type { GlossaryTerm } from "../model/types";

function createGlossaryClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminClient() as any;
}

export async function findAllGlossaryTerms(): Promise<GlossaryTerm[]> {
  const supabase = createGlossaryClient();
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("*")
    .order("reading", { ascending: true });

  if (error) {
    throw error;
  }
  return (data ?? []) as GlossaryTerm[];
}

export async function findGlossaryTermBySlug(
  slug: string,
): Promise<GlossaryTerm | null> {
  const supabase = createGlossaryClient();
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data as GlossaryTerm | null;
}

export async function findGlossaryTermsBySlugs(
  slugs: string[],
): Promise<Pick<GlossaryTerm, "slug" | "term" | "definition">[]> {
  const supabase = createGlossaryClient();
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("slug, term, definition")
    .in("slug", slugs);

  if (error) {
    throw error;
  }
  return (data ?? []) as Pick<GlossaryTerm, "slug" | "term" | "definition">[];
}

export async function findGlossaryTermLinks(): Promise<
  { slug: string; term: string }[]
> {
  const supabase = createGlossaryClient();
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("slug, term");

  if (error) {
    throw error;
  }
  return (data ?? []) as { slug: string; term: string }[];
}

export async function findGlossaryTermSlugs(): Promise<
  { slug: string; updated_at: string | null }[]
> {
  const supabase = createGlossaryClient();
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("slug, updated_at");

  if (error) {
    throw error;
  }
  return (data ?? []) as { slug: string; updated_at: string | null }[];
}

export async function upsertGlossaryTerms(
  terms: Omit<GlossaryTerm, "id" | "created_at" | "updated_at">[],
): Promise<{ inserted: number; updated: number }> {
  const supabase = createGlossaryClient();

  const existingSlugs = new Set(
    (await findGlossaryTermSlugs()).map((t) => t.slug),
  );

  const { error } = await supabase
    .from("glossary_terms")
    .upsert(terms, { onConflict: "slug" });

  if (error) {
    throw error;
  }

  let inserted = 0;
  let updated = 0;
  for (const term of terms) {
    if (existingSlugs.has(term.slug)) {
      updated++;
    } else {
      inserted++;
    }
  }

  return { inserted, updated };
}
