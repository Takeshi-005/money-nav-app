"use client";

import Link from "next/link";
import { NEWS_CATEGORIES } from "@/entities/news-article";
import { cn } from "@/shared/lib/utils";

const CHIP_BASE = "px-3 py-1.5 rounded-full text-xs font-medium transition-colors";
const CHIP_ACTIVE = "bg-brand-500 text-white";
const CHIP_INACTIVE = "bg-surface-tertiary text-(--text-secondary) hover:bg-surface-secondary";

interface Props {
  selectedCategory: string | null;
}

export function CategoryFilter({ selectedCategory }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Link
        href="/news-articles"
        className={cn(CHIP_BASE, !selectedCategory ? CHIP_ACTIVE : CHIP_INACTIVE)}
      >
        すべて
      </Link>
      {NEWS_CATEGORIES.map((category) => (
        <Link
          key={category}
          href={`/news-articles?category=${encodeURIComponent(category)}`}
          className={cn(
            CHIP_BASE,
            selectedCategory === category ? CHIP_ACTIVE : CHIP_INACTIVE,
          )}
        >
          {category}
        </Link>
      ))}
    </div>
  );
}
