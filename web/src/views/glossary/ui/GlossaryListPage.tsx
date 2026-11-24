import Link from "next/link";
import {
  findAllGlossaryTerms,
  type GlossaryTerm,
} from "@/entities/glossary-term";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import { getCategoryColor } from "../lib";

function groupByCategory(terms: GlossaryTerm[]): Record<string, GlossaryTerm[]> {
  const groups: Record<string, GlossaryTerm[]> = {};
  for (const term of terms) {
    const cat = term.category;
    if (!groups[cat]) {groups[cat] = [];}
    groups[cat].push(term);
  }
  return groups;
}

export async function GlossaryListPage() {
  const glossaryTerms = await findAllGlossaryTerms();
  const grouped = groupByCategory(glossaryTerms);
  const categories = Object.keys(grouped).sort();

  return (
    <div className="container mx-auto my-8 px-6 sm:px-8 py-8 max-w-4xl bg-surface-secondary rounded-2xl shadow-sm">
      <div className="mb-8">
        <Typography variant="title_M" className="mb-3">
          投資用語辞典
        </Typography>
        <Typography variant="M" className="text-(--text-secondary)">
          投資初心者が知っておきたい用語を分かりやすく解説します。
        </Typography>
      </div>

      {glossaryTerms.length === 0 ? (
        <div className="text-center py-16">
          <Typography variant="L" className="text-(--text-secondary)">
            用語データを準備中です。もうしばらくお待ちください。
          </Typography>
        </div>
      ) : (
        <>
          <nav className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <a
                key={cat}
                href={`#${cat}`}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:opacity-80",
                  getCategoryColor(cat),
                )}
              >
                {cat} ({grouped[cat].length})
              </a>
            ))}
          </nav>

          {categories.map((cat) => (
            <section key={cat} id={cat} className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 rounded-full bg-gradient-brand" />
                <Typography variant="title_SS">{cat}</Typography>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {grouped[cat].map((term) => (
                  <Link
                    key={term.slug}
                    href={`/glossary/${term.slug}`}
                    className="group block p-4 rounded-xl bg-surface-elevated border border-(--border-primary) hover:border-brand-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <Typography variant="M_bold" className="group-hover:text-brand-600 transition-colors">
                        {term.term}
                      </Typography>
                      {term.reading && (
                        <Typography variant="caution" className="text-(--text-tertiary)">
                          {term.reading}
                        </Typography>
                      )}
                    </div>
                    <Typography variant="S" className="text-(--text-secondary) line-clamp-2">
                      {term.definition}
                    </Typography>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
