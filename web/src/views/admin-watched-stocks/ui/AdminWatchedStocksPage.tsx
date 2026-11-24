"use client";

import { useState } from "react";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import { useWatchedStocks } from "../model";
import type { WatchedStock } from "../model/types";

export function AdminWatchedStocksPage() {
  const [tickerCode, setTickerCode] = useState("");
  const [nextEarningsDate, setNextEarningsDate] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState("");

  const {
    stocks,
    isLoading,
    addMutation,
    toggleMutation,
    earningsDateMutation,
    deleteMutation,
  } = useWatchedStocks({
    onAddSuccess: () => {
      setTickerCode("");
      setNextEarningsDate("");
      setFormError("");
    },
    onAddError: (message) => setFormError(message),
    onActionSuccess: () => {
      setActionError("");
      setEditingId(null);
    },
    onActionError: (message) => setActionError(message),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    addMutation.mutate({
      ticker_code: tickerCode.trim(),
      next_earnings_date: nextEarningsDate || null,
    });
  };

  const startEditing = (stock: WatchedStock) => {
    setEditingId(stock.id);
    setEditingDate(stock.next_earnings_date ?? "");
  };

  const saveEditing = (id: string) => {
    earningsDateMutation.mutate({
      id,
      next_earnings_date: editingDate || null,
    });
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-6 rounded-full bg-gradient-brand" />
          <Typography variant="title_S" as="h1">
            注目銘柄管理
          </Typography>
        </div>
        <Typography variant="S" className="text-(--text-secondary)">
          登録した銘柄が毎日のニュース影響分析の対象になります
        </Typography>
      </div>

      <form
        onSubmit={handleAdd}
        className="p-5 rounded-2xl bg-surface-elevated border border-(--border-primary) space-y-4"
      >
        <Typography variant="M_bold">銘柄を追加</Typography>
        <Typography variant="caution" className="text-(--text-tertiary)">
          証券コードを入力すると、AIが銘柄名を自動取得して登録します
        </Typography>
        <div className="flex gap-3">
          <input
            type="text"
            maxLength={4}
            placeholder="証券コード（例: 7203 / 285A）"
            value={tickerCode}
            onChange={(e) => setTickerCode(e.target.value.toUpperCase())}
            required
            className="flex-1 px-3 py-2 rounded-lg border border-(--border-primary) bg-surface-secondary text-sm text-foreground focus:outline-none focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {addMutation.isPending ? "銘柄名を取得中…" : "追加"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Typography
            variant="caution"
            className="text-(--text-secondary) shrink-0"
          >
            次回決算発表日（任意）
          </Typography>
          <input
            type="date"
            value={nextEarningsDate}
            onChange={(e) => setNextEarningsDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-(--border-primary) bg-surface-secondary text-sm text-foreground focus:outline-none focus:border-brand-400"
          />
        </div>
        {formError && (
          <Typography variant="caution" className="text-negative-600">
            {formError}
          </Typography>
        )}
      </form>

      <div className="rounded-2xl bg-surface-elevated border border-(--border-primary) overflow-hidden">
        <div className="px-5 py-4 border-b border-(--border-primary) flex items-center justify-between">
          <Typography variant="M_bold">登録銘柄一覧</Typography>
          <Typography variant="caution" className="text-(--text-tertiary)">
            {stocks.length}銘柄
          </Typography>
        </div>

        {actionError && (
          <div className="px-5 py-3 bg-negative-50 border-b border-(--border-primary)">
            <Typography variant="caution" className="text-negative-600">
              {actionError}
            </Typography>
          </div>
        )}

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-surface-secondary animate-pulse"
              />
            ))}
          </div>
        ) : stocks.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Typography variant="S" className="text-(--text-secondary)">
              銘柄が登録されていません
            </Typography>
          </div>
        ) : (
          <div className="divide-y divide-(--border-primary)">
            {stocks.map((stock) => (
              <div key={stock.id} className="px-5 py-3">
                <div className="flex items-center gap-4">
                  <Typography
                    variant="S_bold"
                    className="w-16 text-(--text-secondary) font-mono"
                  >
                    {stock.ticker_code}
                  </Typography>
                  <Typography variant="S" className="flex-1">
                    {stock.company_name}
                  </Typography>
                  <button
                    onClick={() =>
                      toggleMutation.mutate({
                        id: stock.id,
                        is_active: !stock.is_active,
                      })
                    }
                    disabled={toggleMutation.isPending}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      stock.is_active
                        ? "bg-positive-100 text-positive-700 hover:bg-positive-200"
                        : "bg-surface-tertiary text-(--text-tertiary) hover:bg-surface-secondary",
                    )}
                  >
                    {stock.is_active ? "有効" : "無効"}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(stock.id)}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-negative-600 hover:bg-negative-50 transition-colors disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-2 pl-20">
                  <Typography
                    variant="caution"
                    className="text-(--text-tertiary) shrink-0"
                  >
                    次回決算発表日
                  </Typography>
                  {editingId === stock.id ? (
                    <>
                      <input
                        type="date"
                        value={editingDate}
                        onChange={(e) => setEditingDate(e.target.value)}
                        className="px-2 py-1 rounded-md border border-(--border-primary) bg-surface-secondary text-xs text-foreground focus:outline-none focus:border-brand-400"
                      />
                      <button
                        onClick={() => saveEditing(stock.id)}
                        disabled={earningsDateMutation.isPending}
                        className="px-2 py-1 rounded-md text-xs font-medium bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 rounded-md text-xs font-medium text-(--text-secondary) hover:bg-surface-secondary transition-colors"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <>
                      <Typography
                        variant="caution"
                        className="text-(--text-secondary)"
                      >
                        {stock.next_earnings_date ?? "未設定"}
                      </Typography>
                      <button
                        onClick={() => startEditing(stock)}
                        className="px-2 py-1 rounded-md text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        編集
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
