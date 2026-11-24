import { Typography } from "@/shared/ui/typography";
import { DIAGNOSIS_FAQ_ITEMS } from "../lib/faq-data";

export function DiagnosisFaq() {
  return (
    <section
      aria-labelledby="diagnosis-faq-heading"
      className="py-12 md:py-16"
    >
      <div className="max-w-2xl mx-auto px-4">
        <Typography
          variant="title_S"
          as="h2"
          id="diagnosis-faq-heading"
          className="text-center mb-8"
        >
          よくある質問
        </Typography>
        <div className="space-y-3">
          {DIAGNOSIS_FAQ_ITEMS.map((item, index) => (
            <details
              key={index}
              className="group rounded-2xl bg-surface-secondary border border-(--border-primary) overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-3 p-5 cursor-pointer list-none hover:bg-surface-tertiary transition-colors">
                <Typography variant="M_bold" as="span" className="flex-1">
                  Q. {item.question}
                </Typography>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-brand-500 text-xl transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 pt-1 border-t border-(--border-primary)">
                <Typography
                  variant="S"
                  className="text-(--text-secondary) leading-relaxed"
                >
                  A. {item.answer}
                </Typography>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
