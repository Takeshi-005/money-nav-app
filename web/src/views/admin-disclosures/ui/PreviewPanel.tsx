"use client";

import { Typography } from "@/shared/ui/typography";
import { SummaryCard } from "./SummaryCard";
import { EventsList } from "./EventsList";
import type { PreviewResponse } from "../model/types";

export function PreviewPanel({
  preview,
  onConfirm,
  onCancel,
  isImporting,
  importError,
}: {
  preview: PreviewResponse;
  onConfirm: () => void;
  onCancel: () => void;
  isImporting: boolean;
  importError: string;
}) {
  return (
    <section className="space-y-5">
      <SummaryCard
        articleDate={preview.payload.articleDate}
        sourceUrl={preview.payload.sourceUrl}
        summary={preview.summary}
        duplicate={preview.duplicate}
      />
      <EventsList events={preview.events} />
      <div className="p-5 rounded-2xl bg-surface-elevated border border-(--border-primary) space-y-3">
        <Typography variant="M_bold">
          内容を確認したら保存してください
        </Typography>
        <Typography variant="caution" className="text-(--text-tertiary)">
          保存すると disclosure_imports / disclosure_events /
          stock_impact_analyses（source=disclosure）に書き込みます
        </Typography>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isImporting || preview.duplicate != null}
            className="px-5 py-2 rounded-lg bg-positive-600 text-white text-sm font-medium hover:bg-positive-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isImporting ? "保存中…" : "保存する"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-(--text-secondary) hover:bg-surface-secondary transition-colors"
          >
            キャンセル
          </button>
          {importError && (
            <Typography variant="caution" className="text-negative-600">
              {importError}
            </Typography>
          )}
        </div>
        {preview.duplicate && (
          <Typography variant="caution" className="text-accent-700">
            同じ内容のJSONが {preview.duplicate.importedAt}{" "}
            に取り込み済みのため保存できません
          </Typography>
        )}
      </div>
    </section>
  );
}
