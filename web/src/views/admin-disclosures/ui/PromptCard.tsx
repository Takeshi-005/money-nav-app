"use client";

import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import { CLAUDE_AI_DISCLOSURE_PROMPT } from "@/shared/api/gemini/disclosure-extraction";

export function PromptCard({
  isOpen,
  onToggle,
  onCopy,
  copiedAt,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onCopy: () => void;
  copiedAt: number | null;
}) {
  return (
    <section className="rounded-2xl bg-surface-elevated border border-(--border-primary) overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-secondary transition-colors"
      >
        <div className="flex items-center gap-3">
          <Typography variant="M_bold">claude.ai 用プロンプト</Typography>
          <Typography variant="caution" className="text-(--text-tertiary)">
            {isOpen ? "閉じる" : "表示してコピー"}
          </Typography>
        </div>
        <span
          className={cn(
            "inline-block transition-transform text-(--text-secondary)",
            isOpen && "rotate-180",
          )}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-5 py-4 border-t border-(--border-primary) space-y-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCopy}
              className="px-4 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
            >
              プロンプトをコピー
            </button>
            {copiedAt && (
              <Typography variant="caution" className="text-positive-600">
                コピーしました
              </Typography>
            )}
          </div>
          <pre className="text-xs p-3 rounded-lg bg-surface-tertiary border border-(--border-primary) overflow-auto max-h-80 whitespace-pre-wrap text-(--text-secondary)">
            {CLAUDE_AI_DISCLOSURE_PROMPT}
          </pre>
        </div>
      )}
    </section>
  );
}
