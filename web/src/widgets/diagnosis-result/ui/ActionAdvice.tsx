"use client";

/**
 * Action Advice Component
 * 行動アドバイスカード
 */

import { Typography } from "@/shared/ui/typography";

export interface ActionAdviceProps {
  advice?: string;
}

export function ActionAdvice({ advice }: ActionAdviceProps) {
  if (!advice) {
    return null;
  }

  return (
    <div className="p-6 rounded-3xl mb-6 bg-gradient-accent">
      <div className="flex items-center gap-2 mb-3">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
        <h2 className="text-lg font-bold ">行動アドバイス</h2>
      </div>
      <Typography variant="S" className="text-white/90 leading-relaxed">
        {advice}
      </Typography>
    </div>
  );
}
