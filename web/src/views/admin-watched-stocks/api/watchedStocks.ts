import type { WatchedStock } from "../model/types";

export async function fetchWatchedStocks(): Promise<WatchedStock[]> {
  const res = await fetch("/api/admin/watched-stocks");
  if (!res.ok) {
    throw new Error("取得に失敗しました");
  }
  const data = await res.json();
  return data.stocks;
}

export async function addWatchedStock(body: {
  ticker_code: string;
  next_earnings_date?: string | null;
}): Promise<void> {
  const res = await fetch("/api/admin/watched-stocks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "追加に失敗しました");
  }
}

export async function updateWatchedStockActive(params: {
  id: string;
  is_active: boolean;
}): Promise<void> {
  const res = await fetch(`/api/admin/watched-stocks/${params.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: params.is_active }),
  });
  if (!res.ok) {
    throw new Error("有効状態の更新に失敗しました");
  }
}

export async function updateWatchedStockEarningsDate(params: {
  id: string;
  next_earnings_date: string | null;
}): Promise<void> {
  const res = await fetch(`/api/admin/watched-stocks/${params.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ next_earnings_date: params.next_earnings_date }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "決算発表日の更新に失敗しました");
  }
}

export async function deleteWatchedStock(id: string): Promise<void> {
  const res = await fetch(`/api/admin/watched-stocks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("削除に失敗しました");
  }
}

