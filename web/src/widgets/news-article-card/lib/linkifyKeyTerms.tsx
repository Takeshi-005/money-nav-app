import type { ReactNode } from "react";
import type { NewsArticleContent } from "@/entities/news-article";
import {
  linkifyTerms,
  mergeLinkableTerms,
  type LinkableTerm,
} from "@/shared/lib/auto-link-glossary";

type KeyTerm = NewsArticleContent["sections"][number]["keyTerms"][number];

function toLinkableTerms(keyTerms: KeyTerm[]): LinkableTerm[] {
  const result: LinkableTerm[] = [];
  for (const kt of keyTerms) {
    if (kt.slug) {
      result.push({ term: kt.term, slug: kt.slug });
    }
  }
  return result;
}

export function linkifyKeyTerms(
  text: string,
  keyTerms: KeyTerm[],
  glossaryTerms: LinkableTerm[] = [],
): ReactNode {
  const primary = toLinkableTerms(keyTerms);
  const merged = mergeLinkableTerms(primary, glossaryTerms);
  return linkifyTerms(text, merged);
}
