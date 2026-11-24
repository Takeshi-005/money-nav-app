import { cn } from "@/shared/lib/utils";
import Link from "next/link";
import { Typography } from "@/shared/ui/typography";

interface CTASectionProps {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  subText?: string;
}

export function CTASection({
  title,
  description,
  ctaText,
  ctaHref,
  subText,
}: CTASectionProps) {
  return (
    <section className="py-14 md:py-18">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-10 md:p-16 rounded-[2rem] relative overflow-hidden bg-gradient-brand shadow-xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-30 bg-accent-400" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 bg-brand-300" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold  mb-4 tracking-tight">
              {title}
            </h2>
            <Typography
              variant="L"
              color="white"
              className="mb-8 whitespace-pre-line"
            >
              {description}
            </Typography>
            <Link
              href={ctaHref}
              className={cn(
                "inline-flex items-center gap-3 px-10 py-5",
                "rounded-2xl text-lg font-semibold transition-all duration-300",
                "hover:scale-[1.02] bg-white text-brand-700 shadow-lg text-gray-900",
              )}
            >
              {ctaText}
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
            {subText && (
              <Typography variant="S" className="mt-6 text-white/70">
                {subText}
              </Typography>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
