const CATEGORY_COLORS: Record<string, string> = {
  "基本指標": "bg-brand-50 text-brand-700",
  "チャート分析": "bg-accent-50 text-accent-700",
  "ファンダメンタルズ": "bg-positive-50 text-positive-700",
  "投資手法": "bg-blue-50 text-blue-700",
  "市場・制度": "bg-purple-50 text-purple-700",
  "リスク管理": "bg-negative-50 text-negative-700",
  "その他": "bg-neutral-100 text-neutral-600",
};

const FALLBACK_COLOR = "bg-neutral-100 text-neutral-600";

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLOR;
}
