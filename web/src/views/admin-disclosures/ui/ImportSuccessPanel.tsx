"use client";

import { Typography } from "@/shared/ui/typography";
import { StatBox } from "./badges";
import type { ImportResponse } from "../model/types";

export function ImportSuccessPanel({ result }: { result: ImportResponse }) {
  return (
    <section className="p-5 rounded-2xl bg-positive-50 border border-positive-200 space-y-2">
      <Typography variant="M_bold" className="text-positive-700">
        保存しました
      </Typography>
      <Typography variant="caution" className="text-positive-700">
        Import ID: {result.importId}
      </Typography>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="開示イベント" value={result.savedEventsCount} tone="positive" />
        <StatBox label="影響判定" value={result.savedAnalysesCount} tone="positive" />
        <StatBox label="うち登録銘柄" value={result.watchedCount} />
        <StatBox label="うち未登録" value={result.unwatchedCount} />
      </div>
    </section>
  );
}
