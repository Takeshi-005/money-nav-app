"use client";

import { Typography } from "@/shared/ui/typography";

/**
 * Option Button Component
 * 選択肢ボタン
 */

export interface OptionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function OptionButton({ label, icon, onClick }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left bg-surface-tertiary border-2 border-(--border-primary) transition-all duration-300 hover:scale-[1.02] hover:border-brand-500 hover:bg-surface-elevated group"
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface-secondary text-(--text-tertiary) transition-all duration-300">
        {icon}
      </div>
      <Typography variant="L_bold" as="span">
        {label}
      </Typography>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-auto opacity-0 group-hover:opacity-100 text-brand-500 transition-opacity duration-200"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}
