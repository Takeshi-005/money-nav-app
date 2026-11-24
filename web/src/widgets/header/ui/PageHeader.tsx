"use client";

import Link from "next/link";
import { Typography } from "@/shared/ui/typography";
import { HeaderActions } from "./HeaderActions";
import { NAVIGATION_PATHS } from "@/shared/config";

interface PageHeaderProps {
  title: string;
  backHref?: string;
  updatedAt?: string;
}

export function PageHeader({
  title,
  backHref = NAVIGATION_PATHS.ROOT,
  updatedAt,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-secondary border-b-(--border-primary) shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg text-(--text-secondary) transition-all duration-200 hover:scale-105 hover:bg-surface-tertiary hover:text-foreground"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19L5 12L12 5" />
              </svg>
              <span className="text-sm font-medium hidden sm:inline">戻る</span>
            </Link>

            <div className="ml-2 pl-4 border-l border-(--border-primary)">
              <Typography variant="L_bold" as="h1" className="text-foreground">
                {title}
              </Typography>
            </div>
          </div>

          <HeaderActions updatedAt={updatedAt} />
        </div>
      </div>
    </header>
  );
}
