import { cn } from "@/shared/lib/utils";
import Link from "next/link";
import { Typography } from "@/shared/ui/typography";

interface FeatureCardLargeProps {
  title: string;
  description: string;
  href: string;
  linkText: string;
}

export function FeatureCardLarge({
  title,
  description,
  href,
  linkText,
}: FeatureCardLargeProps) {
  return (
    <div
      className={cn(
        "lg:col-span-2 p-8 rounded-3xl transition-all duration-300 hover:scale-[1.01] group bg-gradient-brand-deep shadow-lg",
        "border border-accent-200 shadow-md",
      )}
    >
      <div className="flex flex-col h-full">
        <Typography
          color="white"
          className="mb-6 text-2xl md:text-3xl"
          variant="title_S"
        >
          {title}
        </Typography>
        <Typography variant="L" color="white" className="mb-6">
          {description}
        </Typography>
        <Link
          href={href}
          className="inline-flex items-center gap-2 font-medium group-hover:gap-3 transition-all"
        >
          <Typography variant="L" color="white">
            {linkText}
          </Typography>
        </Link>
      </div>
    </div>
  );
}
