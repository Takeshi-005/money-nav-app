import type { NewsArticleContent } from "@/entities/news-article";
import type { LinkableTerm } from "@/shared/lib/auto-link-glossary";
import { Typography } from "@/shared/ui/typography";
import { linkifyKeyTerms } from "../lib/linkifyKeyTerms";
import { KeyTermsBox } from "./KeyTermsBox";

type Section = NewsArticleContent["sections"][number];

interface Props {
  section: Section;
  index: number;
  glossaryTerms?: LinkableTerm[];
}

export function ArticleSection({ section, index, glossaryTerms = [] }: Props) {
  const paragraphs = section.body.split("\n").filter((p) => p.trim() !== "");

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-foreground mb-3">
        <span className="text-brand-500 mr-2">0{index + 1}</span>
        {section.heading}
      </h2>
      <div className="space-y-3">
        {paragraphs.map((paragraph, i) => (
          <Typography
            key={i}
            variant="S"
            className="text-(--text-secondary) leading-relaxed"
          >
            {linkifyKeyTerms(paragraph, section.keyTerms, glossaryTerms)}
          </Typography>
        ))}
      </div>
      <KeyTermsBox keyTerms={section.keyTerms} />
    </div>
  );
}
