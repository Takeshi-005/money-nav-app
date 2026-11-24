import type { ReactNode } from "react";
import Link from "next/link";

export interface LinkableTerm {
  term: string;
  slug: string;
}

const MIN_TERM_LENGTH = 2;
const MAX_LINKS_PER_TEXT = 5;
const LINK_CLASS_NAME =
  "text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-700 hover:decoration-brand-500";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function linkifyTerms(
  text: string,
  terms: LinkableTerm[],
): ReactNode {
  const valid = terms.filter(
    (t) => t.term && t.slug && t.term.length >= MIN_TERM_LENGTH,
  );
  if (valid.length === 0) {
    return text;
  }

  const sorted = [...valid].sort((a, b) => b.term.length - a.term.length);
  const pattern = new RegExp(
    `(${sorted.map((t) => escapeRegExp(t.term)).join("|")})`,
  );

  const termToSlug = new Map<string, string>();
  for (const t of sorted) {
    if (!termToSlug.has(t.term)) {
      termToSlug.set(t.term, t.slug);
    }
  }

  const parts = text.split(pattern);
  if (parts.length === 1) {
    return text;
  }

  const linked = new Set<string>();
  return parts.map((part, i) => {
    const slug = termToSlug.get(part);
    if (slug && !linked.has(part) && linked.size < MAX_LINKS_PER_TEXT) {
      linked.add(part);
      return (
        <Link key={i} href={`/glossary/${slug}`} className={LINK_CLASS_NAME}>
          {part}
        </Link>
      );
    }
    return part;
  });
}

export function mergeLinkableTerms(
  primary: LinkableTerm[],
  secondary: LinkableTerm[],
): LinkableTerm[] {
  const seen = new Set(primary.map((t) => t.term));
  const merged: LinkableTerm[] = [...primary];
  for (const t of secondary) {
    if (!seen.has(t.term)) {
      merged.push(t);
      seen.add(t.term);
    }
  }
  return merged;
}
