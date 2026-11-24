import Link from "next/link";
import { Typography } from "@/shared/ui/typography";
import type { NewsArticleContent } from "@/entities/news-article";

type KeyTerm = NewsArticleContent["sections"][number]["keyTerms"][number];

interface Props {
  keyTerms: KeyTerm[];
}

export function KeyTermsBox({ keyTerms }: Props) {
  if (keyTerms.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 rounded-xl bg-brand-50 border border-brand-200">
      <Typography variant="caution" className="font-semibold text-brand-600 mb-2">
        📚 用語解説
      </Typography>
      <div className="space-y-2">
        {keyTerms.map((term, i) => (
          <div key={i}>
            {term.slug ? (
              <Link
                href={`/glossary/${term.slug}`}
                className="hover:underline"
              >
                <Typography as="span" variant="S_bold" className="text-brand-700 hover:text-brand-800">
                  {term.term}
                </Typography>
              </Link>
            ) : (
              <Typography as="span" variant="S_bold" className="text-brand-700">
                {term.term}
              </Typography>
            )}
            <Typography
              as="span"
              variant="S"
              className="text-(--text-secondary)"
            >
              : {term.definition}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  );
}
