export interface GlossaryTerm {
  id: string;
  slug: string;
  term: string;
  reading: string | null;
  category: string;
  definition: string;
  explanation: string;
  example: string | null;
  related_terms: string[] | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  created_at: string;
  updated_at: string;
}

export type GlossaryCategory =
  | "基本指標"
  | "チャート分析"
  | "ファンダメンタルズ"
  | "投資手法"
  | "市場・制度"
  | "リスク管理"
  | "その他";
