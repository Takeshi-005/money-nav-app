"use client";

import { useState } from "react";
import { Typography } from "@/shared/ui/typography";
import {
  useApplySeoMutation,
  usePageAuditDetail,
  useSuggestSeoMutation,
} from "@/features/seo-audit";

interface Props {
  pagePath: string;
  onClose: () => void;
}

export function PageAuditDetailModal({ pagePath, onClose }: Props) {
  const { data: detail, isLoading } = usePageAuditDetail(pagePath);
  const suggest = useSuggestSeoMutation();
  const apply = useApplySeoMutation();

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [edited, setEdited] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyDone, setApplyDone] = useState(false);

  const editable = detail?.editable ?? false;

  async function handleSuggest() {
    setApplyError(null);
    try {
      const result = await suggest.mutateAsync(pagePath);
      setSeoTitle(result.suggestedTitle);
      setSeoDescription(result.suggestedDescription);
      setSeoKeywords(result.suggestedKeywords.join(", "));
      setReasoning(result.reasoning);
      setEdited(false);
    } catch (e) {
      setApplyError(
        e instanceof Error ? e.message : "改善案の生成に失敗しました",
      );
    }
  }

  async function handleApply() {
    setApplyError(null);
    try {
      await apply.mutateAsync({
        pagePath,
        seoTitle,
        seoDescription,
        seoKeywords: seoKeywords
          .split(/[、,]\s*/)
          .map((k) => k.trim())
          .filter(Boolean),
      });
      setApplyDone(true);
    } catch (e) {
      setApplyError(
        e instanceof Error ? e.message : "DB更新に失敗しました",
      );
    }
  }

  const canApply =
    editable &&
    edited &&
    seoTitle.length > 0 &&
    seoTitle.length <= 80 &&
    seoDescription.length > 0 &&
    seoDescription.length <= 200 &&
    !apply.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface-elevated rounded-2xl border border-(--border-primary) max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-(--border-primary) flex items-center justify-between sticky top-0 bg-surface-elevated">
          <Typography variant="L_bold" as="h2">
            {pagePath}
          </Typography>
          <button
            type="button"
            onClick={onClose}
            className="text-(--text-secondary) hover:text-foreground transition-colors px-2"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {isLoading || !detail ? (
            <Typography variant="S" className="text-(--text-secondary)">
              読み込み中…
            </Typography>
          ) : (
            <>
              <section className="space-y-2">
                <Typography variant="S_bold">直近4週の実績</Typography>
                <div className="grid grid-cols-4 gap-3">
                  <Stat label="表示" value={String(detail.totalImpressions)} />
                  <Stat label="クリック" value={String(detail.totalClicks)} />
                  <Stat
                    label="CTR"
                    value={`${(detail.avgCtr * 100).toFixed(2)}%`}
                  />
                  <Stat
                    label="平均順位"
                    value={
                      detail.avgPosition !== null
                        ? detail.avgPosition.toFixed(1)
                        : "—"
                    }
                  />
                </div>
                <Typography
                  variant="caution"
                  className="text-(--text-tertiary)"
                >
                  {detail.classificationReason}
                </Typography>
              </section>

              <section className="space-y-2">
                <Typography variant="S_bold">主要クエリ（上位5件）</Typography>
                {detail.topQueries.length === 0 ? (
                  <Typography variant="S" className="text-(--text-secondary)">
                    実需要キーワードなし
                  </Typography>
                ) : (
                  <div className="space-y-1">
                    {detail.topQueries.map((q) => (
                      <div
                        key={q.query}
                        className="flex items-center justify-between text-sm"
                      >
                        <Typography variant="S" as="span">
                          {q.query}
                        </Typography>
                        <Typography
                          variant="caution"
                          as="span"
                          className="text-(--text-tertiary)"
                        >
                          表示{q.impressions} / 順位{q.position.toFixed(1)} /
                          CTR{(q.ctr * 100).toFixed(2)}%
                        </Typography>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <Typography variant="S_bold">改善案</Typography>
                  <button
                    type="button"
                    onClick={handleSuggest}
                    disabled={suggest.isPending}
                    className="px-3 py-1.5 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 disabled:opacity-50 transition-colors"
                  >
                    {suggest.isPending ? "生成中…" : "改善案をAI生成"}
                  </button>
                </div>

                {!editable && (
                  <div className="rounded-lg bg-surface-tertiary px-3 py-2">
                    <Typography
                      variant="caution"
                      className="text-(--text-secondary)"
                    >
                      このページはDB上書き非対応です。改善案を参考に shared/config/seo-overrides.ts へコードPRを提出してください
                    </Typography>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block">
                    <Typography
                      variant="caution"
                      className="text-(--text-secondary)"
                    >
                      タイトル（{seoTitle.length}/80字）
                    </Typography>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => {
                        setSeoTitle(e.target.value);
                        setEdited(true);
                      }}
                      maxLength={80}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-secondary border border-(--border-primary) text-foreground"
                      placeholder="まず「改善案をAI生成」をクリックしてください"
                    />
                  </label>
                  <label className="block">
                    <Typography
                      variant="caution"
                      className="text-(--text-secondary)"
                    >
                      ディスクリプション（{seoDescription.length}/200字）
                    </Typography>
                    <textarea
                      value={seoDescription}
                      onChange={(e) => {
                        setSeoDescription(e.target.value);
                        setEdited(true);
                      }}
                      maxLength={200}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-secondary border border-(--border-primary) text-foreground"
                    />
                  </label>
                  <label className="block">
                    <Typography
                      variant="caution"
                      className="text-(--text-secondary)"
                    >
                      キーワード（カンマ区切り）
                    </Typography>
                    <input
                      type="text"
                      value={seoKeywords}
                      onChange={(e) => {
                        setSeoKeywords(e.target.value);
                        setEdited(true);
                      }}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-secondary border border-(--border-primary) text-foreground"
                    />
                  </label>
                </div>

                {reasoning && (
                  <div className="rounded-lg bg-surface-secondary px-3 py-2">
                    <Typography
                      variant="caution"
                      className="text-(--text-tertiary)"
                    >
                      AI根拠
                    </Typography>
                    <Typography variant="S" as="div">
                      {reasoning}
                    </Typography>
                  </div>
                )}

                {applyError && (
                  <Typography
                    variant="S"
                    className="text-negative-600"
                    as="div"
                  >
                    {applyError}
                  </Typography>
                )}

                {applyDone && (
                  <Typography
                    variant="S"
                    className="text-positive-600"
                    as="div"
                  >
                    DBに適用しました。検索エンジンへの通知も完了
                  </Typography>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-surface-secondary text-foreground text-sm font-medium hover:bg-surface-tertiary transition-colors"
                  >
                    閉じる
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!canApply}
                    className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    {apply.isPending ? "適用中…" : "DBに適用"}
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-secondary px-3 py-2">
      <Typography variant="caution" className="text-(--text-tertiary)">
        {label}
      </Typography>
      <Typography variant="L_bold" as="div">
        {value}
      </Typography>
    </div>
  );
}
