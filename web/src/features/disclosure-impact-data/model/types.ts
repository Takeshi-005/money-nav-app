import type { DisclosureType } from "@/shared/api/gemini/disclosure-extraction";

export interface DisclosureImpactAnalysis {
  ticker_code: string;
  company_name: string;
  disclosure_type: DisclosureType;
  impact: "positive" | "negative" | "neutral";
  magnitude: "large" | "medium" | "small";
  reason: string;
  educational_note: string | null;
  relevance_score: number | null;
  key_concept: string | null;
}

export interface DisclosureImpactResponse {
  date: string;
  stocks: DisclosureImpactAnalysis[];
}
