import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { Typography } from "@/shared/ui/typography";

interface FeatureCardSmallProps {
  title: string;
  description: string;
  iconBgColor: string;
  iconColor: string;
  href?: string;
}

export function FeatureCardSmall({
  title,
  description,
  href,
}: FeatureCardSmallProps) {
  const content = (
    <>
      <h3 className="text-xl font-bold mb-2 text-foreground tracking-[-0.01em]">
        {title}
      </h3>
      <Typography variant="M" color="gray">
        {description}
      </Typography>
    </>
  );

  const baseClassName =
    "block p-6 md:p-8 rounded-3xl transition-all duration-300 bg-surface-secondary border border-(--border-primary) shadow-md";

  if (href) {
    return (
      <Link href={href} className={cn(baseClassName, "hover:scale-[1.02]")}>
        {content}
      </Link>
    );
  }

  return <div className={baseClassName}>{content}</div>;
}
