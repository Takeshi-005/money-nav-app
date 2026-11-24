import Link from "next/link";
import {
  findAllGlossaryTerms,
  findGlossaryTermsBySlugs,
  type GlossaryTerm,
} from "@/entities/glossary-term";
import { Typography } from "@/shared/ui/typography";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { SocialShareButtons } from "@/shared/ui/social-share";
import { cn } from "@/shared/lib/utils";
import { BRAND } from "@/shared/config";
import { getDifficultyMeta } from "../lib";

interface GlossaryDetailPageProps {
  term: GlossaryTerm;
}

export async function GlossaryDetailPage({ term }: GlossaryDetailPageProps) {
  const { label: difficultyLabel, color: difficultyColor } = getDifficultyMeta(
    term.difficulty,
  );

  return (
    <div className="container mx-auto my-8 px-6 sm:px-8 py-8 max-w-3xl bg-surface-secondary rounded-2xl shadow-sm">
      <Breadcrumbs
        items={[
          { label: "ホーム", href: "/" },
          { label: "用語辞典", href: "/glossary" },
          { label: term.term },
        ]}
        className="mb-6"
      />

      <article>
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Typography
              as="span"
              variant="caution"
              className={cn("px-2.5 py-1 rounded-full font-medium", difficultyColor)}
            >
              {difficultyLabel}
            </Typography>
            <Typography
              as="span"
              variant="caution"
              className="px-2.5 py-1 rounded-full font-medium bg-surface-tertiary text-(--text-secondary)"
            >
              {term.category}
            </Typography>
          </div>
          <Typography variant="title_M" className="mb-2">
            {term.term}
          </Typography>
          {term.reading && (
            <Typography variant="S" className="text-(--text-tertiary)">
              {term.reading}
            </Typography>
          )}
        </header>

        <section className="mb-8 p-6 rounded-2xl bg-brand-50 border border-brand-100">
          <Typography variant="S_bold" className="text-brand-700 mb-2">
            ひとことで言うと
          </Typography>
          <Typography variant="L" className="text-brand-900">
            {term.definition}
          </Typography>
        </section>

        <SocialShareButtons
          url={`${process.env.NEXT_PUBLIC_APP_URL}/glossary/${term.slug}`}
          text={`${term.term}とは？投資の基本用語を${BRAND.NAME}で学ぼう`}
          className="mb-8"
        />

        <section className="mb-8">
          <Typography variant="title_SS" className="mb-4">
            詳しい解説
          </Typography>
          <div className="space-y-4">
            {term.explanation.split("\n\n").map((paragraph, i) => (
              <Typography key={i} variant="M" className="text-(--text-secondary) leading-relaxed">
                {paragraph}
              </Typography>
            ))}
          </div>
        </section>

        {term.example && (
          <section className="mb-8 p-6 rounded-2xl bg-surface-secondary border border-(--border-primary)">
            <Typography variant="S_bold" className="mb-3">
              具体例
            </Typography>
            <Typography variant="M" className="text-(--text-secondary) leading-relaxed">
              {term.example}
            </Typography>
          </section>
        )}

        {term.related_terms && term.related_terms.length > 0 && (
          <section className="mb-8">
            <Typography variant="title_SS" className="mb-4">
              関連する用語
            </Typography>
            <RelatedTerms slugs={term.related_terms} />
          </section>
        )}

        <section className="mb-8">
          <Typography variant="title_SS" className="mb-4">
            同じカテゴリの用語
          </Typography>
          <SameCategoryTerms current={term} />
        </section>
      </article>

      <div className="mt-10 pt-6 border-t border-(--border-primary)">
        <Link
          href="/glossary"
          className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          <Typography as="span" variant="M">←</Typography>
          用語辞典に戻る
        </Link>
      </div>
    </div>
  );
}

async function RelatedTerms({ slugs }: { slugs: string[] }) {
  const terms = await findGlossaryTermsBySlugs(slugs);

  if (terms.length === 0) {return null;}

  return (
    <div className="flex flex-wrap gap-2">
      {terms.map((t) => (
        <Link
          key={t.slug}
          href={`/glossary/${t.slug}`}
          className="px-4 py-2 rounded-xl bg-surface-secondary border border-(--border-primary) hover:border-brand-200 hover:shadow-sm transition-all"
        >
          <Typography variant="S_bold" as="span" className="hover:text-brand-600">
            {t.term}
          </Typography>
        </Link>
      ))}
    </div>
  );
}

const SAME_CATEGORY_LIMIT = 5;

function selectSameCategoryTerms(
  allTerms: GlossaryTerm[],
  current: GlossaryTerm,
): GlossaryTerm[] {
  return allTerms
    .filter((t) => t.category === current.category && t.slug !== current.slug)
    .sort((a, b) => {
      const scoreA = a.difficulty === current.difficulty ? 0 : 1;
      const scoreB = b.difficulty === current.difficulty ? 0 : 1;
      return scoreA - scoreB;
    })
    .slice(0, SAME_CATEGORY_LIMIT);
}

async function SameCategoryTerms({ current }: { current: GlossaryTerm }) {
  const allTerms = await findAllGlossaryTerms();
  const candidates = selectSameCategoryTerms(allTerms, current);

  if (candidates.length === 0) {
    return (
      <Typography variant="S" className="text-(--text-tertiary)">
        このカテゴリには他の用語がまだありません。
      </Typography>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {candidates.map((t) => (
        <Link
          key={t.slug}
          href={`/glossary/${t.slug}`}
          className="px-4 py-2 rounded-xl bg-surface-secondary border border-(--border-primary) hover:border-brand-200 hover:shadow-sm transition-all"
        >
          <Typography variant="S_bold" as="span" className="hover:text-brand-600">
            {t.term}
          </Typography>
        </Link>
      ))}
    </div>
  );
}
