"use client";

import Link from "next/link";
import { TrendUp } from "@/shared/ui/icons";
import { Typography } from "@/shared/ui/typography";
import { HeaderActions } from "./HeaderActions";
import { BRAND, NAVIGATION_PATHS } from "@/shared/config";

interface HeaderProps {
  updatedAt?: string;
}

export default function Header({ updatedAt }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-secondary border-b-(--border-primary) shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={NAVIGATION_PATHS.ROOT}
              className="flex items-center gap-3 group"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-brand shadow-glow-brand transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
                <TrendUp size="lg" className="" strokeWidth={2.5} />
              </div>

              <div>
                <Typography variant="L_bold" className="tracking-tight">
                  {BRAND.NAME}
                </Typography>
                <Typography as="p" variant="caution" color="gray">
                  {BRAND.POWERED_BY}
                </Typography>
              </div>
            </Link>
          </div>

          <HeaderActions updatedAt={updatedAt} />
        </div>
      </div>
    </header>
  );
}
