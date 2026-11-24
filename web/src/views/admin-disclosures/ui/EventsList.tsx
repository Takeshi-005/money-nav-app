"use client";

import { Typography } from "@/shared/ui/typography";
import { DISCLOSURE_TYPE_LABELS } from "@/shared/api/gemini/disclosure-extraction";
import { ImpactBadge, MagnitudeBadge, RelevanceBadge } from "./badges";
import type { PreviewEvent } from "../model/types";

export function EventsList({ events }: { events: PreviewEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-surface-elevated border border-(--border-primary)">
        <Typography variant="S" className="text-(--text-secondary)">
          抽出されたイベントはありません
        </Typography>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-surface-elevated border border-(--border-primary) overflow-hidden">
      <div className="px-5 py-3 border-b border-(--border-primary)">
        <Typography variant="M_bold">抽出イベント詳細</Typography>
      </div>
      <ul className="divide-y divide-(--border-primary)">
        {events.map((e, i) => (
          <li key={`${e.tickerCode}-${i}`} className="px-5 py-4 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Typography
                variant="S_bold"
                className="font-mono text-(--text-secondary)"
              >
                {e.tickerCode}
              </Typography>
              <Typography variant="S">{e.companyName}</Typography>
              <ImpactBadge impact={e.impact} />
              <MagnitudeBadge magnitude={e.magnitude} />
              <RelevanceBadge value={e.relevanceScore} />
              {!e.isWatched && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-accent-100 text-accent-700">
                  未登録
                </span>
              )}
            </div>
            <Typography variant="caution" className="text-(--text-secondary)">
              [{DISCLOSURE_TYPE_LABELS[e.disclosureType]}]
            </Typography>
            <Typography variant="S_bold" className="text-accent-700">
              🎯 {e.keyConcept}
            </Typography>
            <Typography variant="S">{e.reason}</Typography>
            <Typography variant="S" className="whitespace-pre-line">
              💡 {e.educationalNote}
            </Typography>
          </li>
        ))}
      </ul>
    </div>
  );
}
