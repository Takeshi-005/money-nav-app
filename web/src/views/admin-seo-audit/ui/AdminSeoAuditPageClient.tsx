"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import type { PageAuditRow, PageClassification } from "@/shared/api/seo/page-audit";
import { pageAuditListQueryOptions } from "@/features/seo-audit";
import { PageAuditDetailModal } from "./PageAuditDetailModal";

interface Props {
  initialRows: PageAuditRow[];
}

const CLASSIFICATION_LABELS: Record<PageClassification, string> = {
  title_mismatch: "タイトル不一致",
  query_unacquired: "クエリ未獲得",
  no_demand: "検索需要ゼロ",
  healthy: "良好",
};

const CLASSIFICATION_STYLES: Record<PageClassification, string> = {
  title_mismatch: "bg-negative-100 text-negative-700",
  query_unacquired: "bg-accent-100 text-accent-700",
  no_demand: "bg-surface-tertiary text-(--text-secondary)",
  healthy: "bg-positive-100 text-positive-700",
};

type FilterKey = PageClassification | "all";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "title_mismatch", label: "タイトル不一致" },
  { key: "query_unacquired", label: "クエリ未獲得" },
  { key: "no_demand", label: "検索需要ゼロ" },
  { key: "healthy", label: "良好" },
];

export function AdminSeoAuditPageClient({ initialRows }: Props) {
  const { data, isFetching, refetch } = useQuery({
    ...pageAuditListQueryOptions(),
    initialData: initialRows,
  });
  const rows = data ?? initialRows;

  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<PageClassification, number> = {
      title_mismatch: 0,
      query_unacquired: 0,
      no_demand: 0,
      healthy: 0,
    };
    for (const r of rows) {
      c[r.classification] += 1;
    }
    return c;
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (filter === "all") {
      return rows;
    }
    return rows.filter((r) => r.classification === filter);
  }, [rows, filter]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-6 rounded-full bg-gradient-brand" />
          <Typography variant="title_S" as="h1">
            SEO監査ダッシュボード
          </Typography>
        </div>
        <Typography variant="S" className="text-(--text-secondary)">
          直近4週のSearch Console実績データで{rows.length}ページを類型化し、改善対象を特定します
        </Typography>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(CLASSIFICATION_LABELS) as PageClassification[]).map(
          (key) => (
            <div
              key={key}
              className="rounded-2xl bg-surface-elevated border border-(--border-primary) px-4 py-3"
            >
              <Typography variant="caution" className="text-(--text-tertiary)">
                {CLASSIFICATION_LABELS[key]}
              </Typography>
              <Typography variant="title_S" as="div">
                {counts[key]}
                <Typography
                  variant="S"
                  as="span"
                  className="ml-1 text-(--text-secondary)"
                >
                  件
                </Typography>
              </Typography>
            </div>
          ),
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-brand-500 text-white"
                  : "bg-surface-secondary text-(--text-secondary) hover:bg-surface-tertiary",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {isFetching ? "更新中…" : "更新"}
        </button>
      </div>

      <div className="rounded-2xl bg-surface-elevated border border-(--border-primary) overflow-hidden">
        <div className="px-5 py-3 grid grid-cols-12 gap-3 bg-surface-secondary border-b border-(--border-primary)">
          <Typography variant="caution" className="col-span-5 text-(--text-secondary)">
            ページ
          </Typography>
          <Typography variant="caution" className="col-span-2 text-(--text-secondary)">
            類型
          </Typography>
          <Typography variant="caution" className="col-span-1 text-(--text-secondary) text-right">
            表示
          </Typography>
          <Typography variant="caution" className="col-span-1 text-(--text-secondary) text-right">
            クリック
          </Typography>
          <Typography variant="caution" className="col-span-1 text-(--text-secondary) text-right">
            CTR
          </Typography>
          <Typography variant="caution" className="col-span-1 text-(--text-secondary) text-right">
            順位
          </Typography>
          <Typography variant="caution" className="col-span-1 text-(--text-secondary) text-right">
            操作
          </Typography>
        </div>

        {filteredRows.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Typography variant="S" className="text-(--text-secondary)">
              対象ページがありません
            </Typography>
          </div>
        ) : (
          <div className="divide-y divide-(--border-primary)">
            {filteredRows.map((row) => (
              <div
                key={row.pagePath}
                className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-surface-secondary/50 transition-colors"
              >
                <div className="col-span-5 min-w-0">
                  <Typography variant="S_bold" className="truncate" as="div">
                    {row.pagePath}
                  </Typography>
                  <Typography
                    variant="caution"
                    className="text-(--text-tertiary) truncate"
                    as="div"
                  >
                    {row.classificationReason}
                  </Typography>
                </div>
                <div className="col-span-2">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded-md text-xs font-medium",
                      CLASSIFICATION_STYLES[row.classification],
                    )}
                  >
                    {CLASSIFICATION_LABELS[row.classification]}
                  </span>
                </div>
                <Typography
                  variant="S"
                  className="col-span-1 text-right text-(--text-secondary)"
                  as="div"
                >
                  {row.totalImpressions}
                </Typography>
                <Typography
                  variant="S"
                  className="col-span-1 text-right text-(--text-secondary)"
                  as="div"
                >
                  {row.totalClicks}
                </Typography>
                <Typography
                  variant="S"
                  className="col-span-1 text-right text-(--text-secondary)"
                  as="div"
                >
                  {(row.avgCtr * 100).toFixed(2)}%
                </Typography>
                <Typography
                  variant="S"
                  className="col-span-1 text-right text-(--text-secondary)"
                  as="div"
                >
                  {row.avgPosition !== null
                    ? row.avgPosition.toFixed(1)
                    : "—"}
                </Typography>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedPath(row.pagePath)}
                    className="px-2 py-1 rounded-md bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
                  >
                    詳細
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPath && (
        <PageAuditDetailModal
          key={selectedPath}
          pagePath={selectedPath}
          onClose={() => setSelectedPath(null)}
        />
      )}
    </main>
  );
}
