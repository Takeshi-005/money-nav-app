import Link from "next/link";
import { cn } from "@/shared/lib/utils";

export interface CrossLinkItem {
  href: string;
  label: string;
  emoji: string;
}

interface CrossLinkSectionProps {
  links: CrossLinkItem[];
  className?: string;
}

export function CrossLinkSection({ links, className }: CrossLinkSectionProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid gap-3",
        links.length === 1 && "grid-cols-1",
        links.length === 2 && "grid-cols-2",
        links.length >= 3 && "grid-cols-2 sm:grid-cols-3",
        className,
      )}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-secondary border border-(--border-primary) text-sm font-medium text-(--text-secondary) hover:bg-surface-tertiary hover:text-foreground transition-colors"
        >
          <span>{link.emoji}</span>
          <span>{link.label}</span>
        </Link>
      ))}
    </div>
  );
}
